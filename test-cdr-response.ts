// Test script to check CDR API response structure
const CDR_CONFIG = {
  headers: {
    'x-v': '3',
    'x-min-v': '1',
    'User-Agent': 'BatteryIQ/1.0'
  }
}

async function testCDRResponse() {
  // Test with an Origin plan
  const planId = 'ORI544508MRA1@VEC' // An Origin plan ID from the logs
  const baseUri = 'https://api.originenergy.com.au/'
  const detailEndpoint = `${baseUri}cds-au/v1/energy/plans/${planId}`

  console.log(`Fetching: ${detailEndpoint}`)

  const response = await fetch(detailEndpoint, {
    headers: CDR_CONFIG.headers
  })

  if (!response.ok) {
    console.error(`Error: ${response.status} ${response.statusText}`)
    return
  }

  const data = await response.json()

  console.log('\n📋 Raw Response Structure:')
  console.log(JSON.stringify(data, null, 2))

  console.log('\n📊 Extracted Values:')
  const planDetail = data.data || {}
  const electricityContract = planDetail.electricityContract || {}

  console.log('Daily Supply Charges:', electricityContract.dailySupplyCharges)
  console.log('Solar Feed-in Tariff:', electricityContract.solarFeedInTariff)
  console.log('Tariff Period:', JSON.stringify(electricityContract.tariffPeriod?.[0], null, 2))
}

testCDRResponse().catch(console.error)
