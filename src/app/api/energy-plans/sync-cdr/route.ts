import { NextRequest } from 'next/server'
import { PrismaClient, TariffType } from '@/generated/prisma'
import { TOP_RETAILERS, CDR_CONFIG, getRetailerEndpoint, type CDRRetailer } from '@/lib/cdr-retailers'

const prisma = new PrismaClient()

// POST /api/energy-plans/sync-cdr - Fetch real plans from CDR retailers with SSE progress
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const retailerSlug = searchParams.get('retailer')
  const priorityOnly = searchParams.get('priorityOnly') === 'true'

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send progress updates
      const sendProgress = (message: string) => {
        console.log(message)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ message })}\n\n`))
      }

      try {
        sendProgress('🔄 Starting CDR plan sync...')

        // Determine which retailers to sync
        let retailersToSync: CDRRetailer[] = TOP_RETAILERS

        if (retailerSlug) {
          const retailer = TOP_RETAILERS.find(r => r.slug === retailerSlug)
          if (!retailer) {
            sendProgress(`❌ Error: Retailer '${retailerSlug}' not found`)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              done: true,
              success: false,
              error: `Retailer '${retailerSlug}' not found`
            })}\n\n`))
            controller.close()
            return
          }
          retailersToSync = [retailer]
          sendProgress(`📍 Syncing single retailer: ${retailer.name}`)
        } else if (priorityOnly) {
          retailersToSync = TOP_RETAILERS.filter(r => r.priority === 1)
          sendProgress(`📍 Syncing Big 3 only: ${retailersToSync.map(r => r.name).join(', ')}`)
        } else {
          sendProgress(`📍 Syncing all top ${retailersToSync.length} retailers`)
        }

        let totalPlansStored = 0
        const results: { retailer: string; plans: number; error?: string }[] = []

        // Sync each retailer
        for (const retailer of retailersToSync) {
          sendProgress(`\n📡 Fetching plans from ${retailer.name}...`)

          try {
            let storedCount = 0
            let page = 1
            let hasMorePages = true
            let totalPlansForRetailer = 0
            let totalElectricityPlans = 0
            let totalGasPlansSkipped = 0

            // Fetch and process pages one at a time (stream processing - no allPlans[] accumulation)
            while (hasMorePages) {
              const endpoint = `${getRetailerEndpoint(retailer)}&page=${page}`

              const response = await fetch(endpoint, {
                headers: CDR_CONFIG.headers,
              })

              if (!response.ok) {
                const errorText = await response.text()
                sendProgress(`❌ ${retailer.name} API error on page ${page}: ${response.status}`)

                // If first page fails, report error. Otherwise, continue with what we have
                if (page === 1) {
                  results.push({
                    retailer: retailer.name,
                    plans: 0,
                    error: `API returned ${response.status}`
                  })
                }
                break
              }

              const data = await response.json()

              if (!data.data || !data.data.plans || data.data.plans.length === 0) {
                sendProgress(`   No more plans on page ${page}`)
                hasMorePages = false
                break
              }

              const pagePlans = data.data.plans
              totalPlansForRetailer += pagePlans.length

              // FILTER: Electricity-only (skip gas plans immediately)
              const electricityPlans = pagePlans.filter((plan: any) =>
                plan.fuelType === 'ELECTRICITY' || plan.fuelType === 'DUAL'
              )
              const gasPlansOnPage = pagePlans.length - electricityPlans.length
              totalElectricityPlans += electricityPlans.length
              totalGasPlansSkipped += gasPlansOnPage

              sendProgress(`   ✅ Page ${page}: ${pagePlans.length} plans (${electricityPlans.length} electricity, ${gasPlansOnPage} gas skipped)`)

              // Process electricity plans immediately (stream processing)
              for (let i = 0; i < electricityPlans.length; i++) {
                const plan = electricityPlans[i]

                try {
                  // Fetch plan details using Plan Detail endpoint
                  const detailEndpoint = `${retailer.baseUri}cds-au/v1/energy/plans/${plan.planId}`

                  // Rate limiting: 100ms delay between detail calls
                  if (i > 0 || storedCount > 0) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                  }

                  if ((storedCount + 1) % 50 === 0 || storedCount === 0) {
                    sendProgress(`   📋 Fetching details: ${storedCount + 1}/${totalElectricityPlans}...`)
                  }

                  const detailResponse = await fetch(detailEndpoint, {
                    headers: {
                      ...CDR_CONFIG.headers,
                      'x-v': '3', // Plan Detail endpoint requires v3
                    },
                  })

                  if (!detailResponse.ok) {
                    sendProgress(`   ⚠️ Failed to fetch details for ${plan.planId}: ${detailResponse.status}`)
                    continue
                  }

                  const detailData = await detailResponse.json()
                  const planDetail = detailData.data || {}

                  // Extract detailed tariff information from plan detail
                  const electricityContract = planDetail.electricityContract || {}
                  const tariffPeriod = electricityContract.tariffPeriod?.[0] || {}

                  // Extract time-of-use rates
                  let peakRate = null, shoulderRate = null, offPeakRate = null
                  let peakTimes = null, shoulderTimes = null, offPeakTimes = null
                  let singleRate = null

                  if (tariffPeriod.rateBlockUType === 'timeOfUseRates') {
                    const touRates = tariffPeriod.timeOfUseRates || []

                    touRates.forEach((rate: any) => {
                      const rateAmount = rate.rates?.[0]?.unitPrice
                      const timeOfUse = rate.timeOfUse || []

                      if (rate.type === 'PEAK') {
                        peakRate = rateAmount
                        peakTimes = JSON.stringify(timeOfUse)
                      } else if (rate.type === 'SHOULDER') {
                        shoulderRate = rateAmount
                        shoulderTimes = JSON.stringify(timeOfUse)
                      } else if (rate.type === 'OFF_PEAK') {
                        offPeakRate = rateAmount
                        offPeakTimes = JSON.stringify(timeOfUse)
                      }
                    })
                  } else if (tariffPeriod.rateBlockUType === 'singleRate') {
                    const singleRateData = tariffPeriod.singleRate
                    singleRate = singleRateData?.rates?.[0]?.unitPrice
                  }

                  // Determine tariff type
                  let tariffType: TariffType = TariffType.FLAT
                  if (peakRate || shoulderRate || offPeakRate) {
                    tariffType = TariffType.TIME_OF_USE
                  } else if (tariffPeriod.demandCharges && tariffPeriod.demandCharges.length > 0) {
                    tariffType = TariffType.DEMAND
                  }

                  // Extract solar feed-in tariff
                  const solarFeedInTariff = electricityContract.solarFeedInTariff?.[0]?.payerType === 'RETAILER'
                    ? electricityContract.solarFeedInTariff[0].tariff?.singleTariff?.rates?.[0]?.unitPrice
                    : null

                  // Determine state from geography
                  let state = 'UNKNOWN'
                  if (plan.geography?.includedPostcodes && plan.geography.includedPostcodes.length > 0) {
                    const firstPostcode = plan.geography.includedPostcodes[0]
                    const pc = parseInt(firstPostcode)
                    if (pc >= 2000 && pc <= 2999) state = 'NSW'
                    else if (pc >= 3000 && pc <= 3999) state = 'VIC'
                    else if (pc >= 4000 && pc <= 4999) state = 'QLD'
                    else if (pc >= 5000 && pc <= 5999) state = 'SA'
                    else if (pc >= 6000 && pc <= 6999) state = 'WA'
                    else if (pc >= 7000 && pc <= 7999) state = 'TAS'
                    else if (pc >= 800 && pc <= 899) state = 'NT'
                    else if (pc >= 2600 && pc <= 2618) state = 'ACT'
                  }

                  // Upsert plan into database (reduced rawData - only store plan ID)
                  await prisma.energyPlan.upsert({
                    where: { id: plan.planId },
                    update: {
                      retailerName: plan.brandName || retailer.name,
                      planName: plan.displayName || plan.planId,
                      state,
                      fuelType: plan.fuelType || 'ELECTRICITY',
                      tariffType,
                      distributors: JSON.stringify(plan.geography?.distributors || []),
                      includedPostcodes: plan.geography?.includedPostcodes ? JSON.stringify(plan.geography.includedPostcodes) : null,
                      excludedPostcodes: plan.geography?.excludedPostcodes ? JSON.stringify(plan.geography.excludedPostcodes) : null,
                      dailySupplyCharge: electricityContract.dailySupplyCharges || 0,
                      peakRate,
                      peakTimes,
                      shoulderRate,
                      shoulderTimes,
                      offPeakRate,
                      offPeakTimes,
                      singleRate,
                      feedInTariff: solarFeedInTariff,
                      payOnTimeDiscount: electricityContract.discounts?.find((d: any) => d.type === 'PAY_ON_TIME')?.percentage || null,
                      directDebitDiscount: electricityContract.discounts?.find((d: any) => d.type === 'DIRECT_DEBIT')?.percentage || null,
                      contractLength: electricityContract.terms?.contractLength || null,
                      exitFees: electricityContract.terms?.exitFees || null,
                      greenPower: !!(electricityContract.greenPowerCharges && electricityContract.greenPowerCharges.length > 0),
                      rawData: JSON.stringify({ planId: plan.planId }), // Reduced memory footprint
                      isActive: true,
                      lastUpdated: new Date(),
                    },
                    create: {
                      id: plan.planId,
                      retailerId: plan.brand || retailer.slug,
                      retailerName: plan.brandName || retailer.name,
                      planName: plan.displayName || plan.planId,
                      state,
                      fuelType: plan.fuelType || 'ELECTRICITY',
                      tariffType,
                      planType: 'MARKET',
                      distributors: JSON.stringify(plan.geography?.distributors || []),
                      includedPostcodes: plan.geography?.includedPostcodes ? JSON.stringify(plan.geography.includedPostcodes) : null,
                      excludedPostcodes: plan.geography?.excludedPostcodes ? JSON.stringify(plan.geography.excludedPostcodes) : null,
                      dailySupplyCharge: electricityContract.dailySupplyCharges || 0,
                      peakRate,
                      peakTimes,
                      shoulderRate,
                      shoulderTimes,
                      offPeakRate,
                      offPeakTimes,
                      singleRate,
                      feedInTariff: solarFeedInTariff,
                      hasBatteryIncentive: false,
                      hasVPP: false,
                      payOnTimeDiscount: electricityContract.discounts?.find((d: any) => d.type === 'PAY_ON_TIME')?.percentage || null,
                      directDebitDiscount: electricityContract.discounts?.find((d: any) => d.type === 'DIRECT_DEBIT')?.percentage || null,
                      contractLength: electricityContract.terms?.contractLength || null,
                      exitFees: electricityContract.terms?.exitFees || null,
                      greenPower: !!(electricityContract.greenPowerCharges && electricityContract.greenPowerCharges.length > 0),
                      carbonNeutral: false,
                      isEVFriendly: false,
                      rawData: JSON.stringify({ planId: plan.planId }), // Reduced memory footprint
                      isActive: true,
                    }
                  })

                  storedCount++
                } catch (planError) {
                  sendProgress(`   ⚠️ Error storing plan ${plan.planId}: ${planError instanceof Error ? planError.message : 'Unknown error'}`)
                }
              }

              // Clear plans from memory (they've been processed)
              // JavaScript GC will handle cleanup, but we can help by nulling references
              pagePlans.length = 0

              // Check if there are more pages
              const totalPages = data.meta?.totalPages || 1
              const totalRecords = data.meta?.totalRecords || totalPlansForRetailer

              if (page >= totalPages || totalPlansForRetailer >= totalRecords) {
                hasMorePages = false
              } else {
                page++
              }
            }

            sendProgress(`   ✅ ${retailer.name}: Processed ${totalPlansForRetailer} total plans (${totalElectricityPlans} electricity, ${totalGasPlansSkipped} gas skipped)`)
            sendProgress(`   💾 Stored ${storedCount} electricity plans for ${retailer.name}`)
            totalPlansStored += storedCount

            results.push({
              retailer: retailer.name,
              plans: storedCount
            })

          } catch (retailerError) {
            const errorMessage = retailerError instanceof Error ? retailerError.message : 'Unknown error'
            sendProgress(`❌ Error syncing ${retailer.name}: ${errorMessage}`)
            results.push({
              retailer: retailer.name,
              plans: 0,
              error: errorMessage
            })
          }

          // Suggest GC after each retailer (if --expose-gc flag is used)
          if (global.gc) {
            global.gc()
          }
        }

        sendProgress(`\n✅ Sync complete! Total electricity plans stored: ${totalPlansStored}`)

        // Send final result
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          done: true,
          success: true,
          totalPlans: totalPlansStored,
          retailers: results,
          timestamp: new Date().toISOString()
        })}\n\n`))

        controller.close()

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        sendProgress(`❌ Fatal error: ${errorMessage}`)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          done: true,
          success: false,
          error: 'Failed to sync energy plans',
          details: errorMessage
        })}\n\n`))
        controller.close()
      } finally {
        await prisma.$disconnect()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
