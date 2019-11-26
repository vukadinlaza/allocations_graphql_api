require('dotenv').config()
const { connect } = require('../index')

const deals = [
  {
    company_name: "Volumetric",
    date_closed: "12/3/19",
    description: "3d printed organs",
    deal_lead: "Kingsley",
    pledge_link: "https://docs.google.com/spreadsheets/d/17xDIkWjJg0ZU88R6tD0LoHyey1nZ9Y57mso_18qFfrk/edit#gid=0",
    closed: false
  },
  {
    company_name: "Superhuman Fund",
    date_closed: "12/3/19",
    description: "",
    pledge_link: "",
    closed: false
  },
  {
    company_name: "Longevity Fund",
    date_closed: "12/15/19",
    description: "",
    pledge_link: "",
    closed: false
  },
  {
    company_name: "Hayman Short Fund",
    date_closed: "12/15/19",
    description: "",
    pledge_link: "",
    closed: false
  }
]

async function seed() {
  const db = await connect()

  return db.collection("deals").insertMany(deals)
}

seed().then(() => console.log("Done"))