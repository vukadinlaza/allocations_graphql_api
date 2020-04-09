const gSheets = require('../src/google-sheets')

describe('google sheets read api', () => {
  test('master fund', async () => {
    const funds = await gSheets.masterFund()
    const helios = funds.find(f => f.name === "Helios Holdings Management LLC")
    expect(helios.steps["Reg D"])
  })
})