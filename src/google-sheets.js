const { GoogleSpreadsheet } = require('google-spreadsheet')
const _ = require('lodash')

const MASTER_FILING = "14sk7GkobeqrjkR1lk7NxoDSa9UNmG5OzcpnjfzfrNWM"

const auth = process.env.NODE_ENV === "production"
  ? { client_email: "sheet-read-write@dashboard-273517.iam.gserviceaccount.com", private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY }
  : require('./priv/google-sheets-service-account.json')

const subCategories = ["Getting started", "Entity", "Pre bank account", "Bank Account", "Crypto Wires", "SPV", "EDGAR", "Reg D"]

async function masterFund () {
  // spreadsheet key is the long id in the sheets URL
  const doc = new GoogleSpreadsheet(MASTER_FILING)

  // auth
  await doc.useServiceAccountAuth(auth)

  await doc.loadInfo()
  const sheet = doc.sheetsByIndex[0]
  await sheet.loadCells('A1:P100')

  const rows = sheet._cells

  // data starts on column 1
  const funds = rows[0].slice(1)
    .reduce((acc, cell, i) => {
      if (cell.value) {
        acc[i + 1] = { name: cell.value, steps: [] }
      }
      return acc
    }, {})

  let subCategory = null
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]

    let step = null;
    // loop through rows contents
    for (let j = 0; j < row.length; j++) {
      const cell = row[j].value

      if (j === 0) {
        // no header value - break
        if (!cell) break

        if (subCategories.includes(cell)) {
          // sub cat - set and break
          subCategory = cell
          break
        } else {
          // set current step
          step = cell
        }
      } else {
        // not first column so could be filled
        const fund = funds[j]
        if (fund && step) {
          const newStep = { step, status: cell === "x" ? 1 : 0, subCategory }
          fund.steps = [...fund.steps, newStep]
        }
      }
    }
  }

  return Object.values(funds)
}

const THROTTLE_INTERVAL = process.env.NODE_ENV === "production" ? 60000 : 10 * 60000
const throttledMasterFund = _.throttle(masterFund, THROTTLE_INTERVAL)

module.exports = { masterFund, throttledMasterFund }