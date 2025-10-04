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
            let updatedCount = 0
            let newCount = 0
            let skippedCount = 0
            let page = 1
            let hasMorePages = true
            let totalPlansForRetailer = 0
            let totalElectricityPlans = 0
            let totalGasPlansSkipped = 0

            // PHASE 1: Quick scan - fetch all plan IDs and lastUpdated timestamps (no details)
            sendProgress(`   🔍 Phase 1: Scanning for changes...`)
            const apiPlanIds = new Set<string>()
            const apiPlanMeta = new Map<string, { lastUpdated: string; fuelType: string }>()

            let scanPage = 1
            let hasMoreScanPages = true

            while (hasMoreScanPages) {
              const endpoint = `${getRetailerEndpoint(retailer)}&page=${scanPage}`
              const response = await fetch(endpoint, { headers: CDR_CONFIG.headers })

              if (!response.ok) {
                sendProgress(`   ❌ Failed to fetch plan list: ${response.status}`)
                break
              }

              const data = await response.json()
              if (!data.data || !data.data.plans || data.data.plans.length === 0) {
                hasMoreScanPages = false
                break
              }

              // Store plan metadata without fetching details
              for (const plan of data.data.plans) {
                apiPlanIds.add(plan.planId)
                apiPlanMeta.set(plan.planId, {
                  lastUpdated: plan.lastUpdated || new Date().toISOString(),
                  fuelType: plan.fuelType
                })
              }

              const totalPages = data.meta?.totalPages || 1
              if (scanPage >= totalPages) {
                hasMoreScanPages = false
              } else {
                scanPage++
              }
            }

            sendProgress(`   ✅ Found ${apiPlanIds.size} total plans from ${retailer.name}`)

            // PHASE 2: Fetch existing plans from database for this retailer
            const existingPlans = await prisma.energyPlan.findMany({
              where: { retailerId: retailer.slug },
              select: {
                id: true,
                lastUpdated: true,
                isActive: true
              }
            })

            const existingPlanMap = new Map(
              existingPlans.map(p => [p.id, { lastUpdated: p.lastUpdated, isActive: p.isActive }])
            )

            sendProgress(`   💾 Found ${existingPlans.length} existing plans in database`)

            // PHASE 3: Determine what needs updating
            const plansToFetch: string[] = []
            const plansToDeactivate: string[] = []

            // Find new and updated plans
            for (const [planId, meta] of apiPlanMeta.entries()) {
              // Skip gas plans immediately
              if (meta.fuelType !== 'ELECTRICITY' && meta.fuelType !== 'DUAL') {
                totalGasPlansSkipped++
                continue
              }

              totalElectricityPlans++

              const existing = existingPlanMap.get(planId)

              if (!existing) {
                // New plan - needs fetching
                plansToFetch.push(planId)
                newCount++
              } else {
                // Existing plan - check if updated
                const apiUpdated = new Date(meta.lastUpdated)
                const dbUpdated = existing.lastUpdated

                if (apiUpdated > dbUpdated) {
                  // Plan has been updated - needs fetching
                  plansToFetch.push(planId)
                  updatedCount++
                } else {
                  // No changes - skip
                  skippedCount++
                }
              }
            }

            // Find deleted plans (in DB but not in API)
            for (const [planId, existing] of existingPlanMap.entries()) {
              if (!apiPlanIds.has(planId) && existing.isActive) {
                plansToDeactivate.push(planId)
              }
            }

            sendProgress(`   📊 Change detection results:`)
            sendProgress(`      🆕 New plans: ${newCount}`)
            sendProgress(`      🔄 Updated plans: ${updatedCount}`)
            sendProgress(`      ⏭️  Unchanged plans: ${skippedCount}`)
            sendProgress(`      🗑️  Deleted plans: ${plansToDeactivate.length}`)
            sendProgress(`      ⛽ Gas plans skipped: ${totalGasPlansSkipped}`)

            // PHASE 4: Deactivate deleted plans
            if (plansToDeactivate.length > 0) {
              await prisma.energyPlan.updateMany({
                where: { id: { in: plansToDeactivate } },
                data: { isActive: false, lastUpdated: new Date() }
              })
              sendProgress(`   ✅ Marked ${plansToDeactivate.length} plans as inactive`)
            }

            // PHASE 5: Fetch details for new/updated plans only
            if (plansToFetch.length === 0) {
              sendProgress(`   ✨ No plans to update - all up to date!`)
              results.push({
                retailer: retailer.name,
                plans: 0
              })
              continue
            }

            sendProgress(`   📥 Fetching details for ${plansToFetch.length} new/updated plans...`)

            // Convert plansToFetch to a Set for O(1) lookup
            const plansToFetchSet = new Set(plansToFetch)

            // Process plans that need updating (no pagination needed - just iterate the list)
            for (let i = 0; i < plansToFetch.length; i++) {
                const planId = plansToFetch[i]

                try {
                  // Fetch plan details using Plan Detail endpoint
                  const detailEndpoint = `${retailer.baseUri}cds-au/v1/energy/plans/${planId}`

                  // Rate limiting: 100ms delay between detail calls
                  if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 100))
                  }

                  if ((i + 1) % 10 === 0 || i === 0) {
                    sendProgress(`   📋 Fetching details: ${i + 1}/${plansToFetch.length}...`)
                  }

                  const detailResponse = await fetch(detailEndpoint, {
                    headers: {
                      ...CDR_CONFIG.headers,
                      'x-v': '3', // Plan Detail endpoint requires v3
                    },
                  })

                  if (!detailResponse.ok) {
                    sendProgress(`   ⚠️ Failed to fetch details for ${planId}: ${detailResponse.status}`)
                    continue
                  }

                  const detailData = await detailResponse.json()
                  const planDetail = detailData.data || {}

                  // Get basic plan info from our metadata map
                  const planMeta = apiPlanMeta.get(planId)
                  if (!planMeta) {
                    sendProgress(`   ⚠️ No metadata found for ${planId}`)
                    continue
                  }

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
                        peakRate = rateAmount ? parseFloat(rateAmount) : null
                        peakTimes = JSON.stringify(timeOfUse)
                      } else if (rate.type === 'SHOULDER') {
                        shoulderRate = rateAmount ? parseFloat(rateAmount) : null
                        shoulderTimes = JSON.stringify(timeOfUse)
                      } else if (rate.type === 'OFF_PEAK') {
                        offPeakRate = rateAmount ? parseFloat(rateAmount) : null
                        offPeakTimes = JSON.stringify(timeOfUse)
                      }
                    })
                  } else if (tariffPeriod.rateBlockUType === 'singleRate') {
                    const singleRateData = tariffPeriod.singleRate
                    const rateValue = singleRateData?.rates?.[0]?.unitPrice
                    singleRate = rateValue ? parseFloat(rateValue) : null
                  }

                  // Determine tariff type
                  let tariffType: TariffType = TariffType.FLAT
                  if (peakRate || shoulderRate || offPeakRate) {
                    tariffType = TariffType.TIME_OF_USE
                  } else if (tariffPeriod.demandCharges && tariffPeriod.demandCharges.length > 0) {
                    tariffType = TariffType.DEMAND
                  }

                  // Extract solar feed-in tariff
                  const solarFitValue = electricityContract.solarFeedInTariff?.[0]?.payerType === 'RETAILER'
                    ? electricityContract.solarFeedInTariff[0].tariff?.singleTariff?.rates?.[0]?.unitPrice
                    : null
                  const solarFeedInTariff = solarFitValue ? parseFloat(solarFitValue) : null

                  // Extract geography data from plan detail
                  const geography = planDetail.geography || {}

                  // Determine state from geography
                  let state = 'UNKNOWN'
                  if (geography.includedPostcodes && geography.includedPostcodes.length > 0) {
                    const firstPostcode = geography.includedPostcodes[0]
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
                    where: { id: planId },
                    update: {
                      retailerName: planDetail.brandName || retailer.name,
                      planName: planDetail.displayName || planId,
                      state,
                      fuelType: planMeta.fuelType,
                      tariffType,
                      distributors: JSON.stringify(geography.distributors || []),
                      includedPostcodes: geography.includedPostcodes ? JSON.stringify(geography.includedPostcodes) : null,
                      excludedPostcodes: geography.excludedPostcodes ? JSON.stringify(geography.excludedPostcodes) : null,
                      dailySupplyCharge: electricityContract.dailySupplyCharges ? parseFloat(electricityContract.dailySupplyCharges) : 0,
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
                      rawData: JSON.stringify({ planId: planId }), // Reduced memory footprint
                      isActive: true,
                      lastUpdated: new Date(),
                    },
                    create: {
                      id: planId,
                      retailerId: planDetail.brand || retailer.slug,
                      retailerName: planDetail.brandName || retailer.name,
                      planName: planDetail.displayName || planId,
                      state,
                      fuelType: planMeta.fuelType,
                      tariffType,
                      planType: 'MARKET',
                      distributors: JSON.stringify(geography.distributors || []),
                      includedPostcodes: geography.includedPostcodes ? JSON.stringify(geography.includedPostcodes) : null,
                      excludedPostcodes: geography.excludedPostcodes ? JSON.stringify(geography.excludedPostcodes) : null,
                      dailySupplyCharge: electricityContract.dailySupplyCharges ? parseFloat(electricityContract.dailySupplyCharges) : 0,
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
                      rawData: JSON.stringify({ planId: planId }), // Reduced memory footprint
                      isActive: true,
                    }
                  })

                  storedCount++
                } catch (planError) {
                  sendProgress(`   ⚠️ Error storing plan ${planId}: ${planError instanceof Error ? planError.message : 'Unknown error'}`)
                }
              }

            sendProgress(`   ✅ ${retailer.name} sync complete:`)
            sendProgress(`      Total plans from API: ${apiPlanIds.size}`)
            sendProgress(`      Electricity plans: ${totalElectricityPlans}`)
            sendProgress(`      New plans: ${newCount}`)
            sendProgress(`      Updated plans: ${updatedCount}`)
            sendProgress(`      Stored/Updated: ${storedCount}`)
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
