const {Builder, By, Key, until} = require('selenium-webdriver')
const { MongoClient } = require("mongodb")

const READ_ONLY_PASS = "3UqdCe62Jxw4bbqj"
const READ_ONLY_USER = "read_only"
const MONGO_URL = `mongodb+srv://${READ_ONLY_USER}:${READ_ONLY_PASS}@allocations-3plbs.gcp.mongodb.net/`

const client = new MongoClient(MONGO_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
})

test('ensure all public links work', async () => {
  let driver = await new Builder()
    .forBrowser('chrome')
    .build()

  const db = (await client.connect()).db("allocations-dashboard")
  const deals = await db.collection("deals").find({ status: { $ne: "closed" }}).toArray()

  const links = await Promise.all(deals.map(async d => {
    const { slug } = await db.collection("organizations").findOne({ _id: d.organization })
    return [d.slug, slug, `https://dashboard.allocations.com/public/${slug}/deals/${d.slug}?invite_code=${d.inviteKey}`]
  }))

  for (let [deal, fund, link] of links) {
    try {
      await driver.get(link)
      await driver.wait(until.elementLocated(By.className("Deal")), 5000)
      console.log(`✅ ${deal} (${fund})`)
    } catch (e) {
      console.log(`❌ ${deal} (${fund})`)
    } 
  }
    
  return driver.quit()
}, 60000)