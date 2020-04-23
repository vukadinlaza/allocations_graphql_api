const {Builder, By, Key, until} = require('selenium-webdriver')
const { MongoClient } = require("mongodb")

const READ_ONLY_PASS = "3UqdCe62Jxw4bbqj"
const READ_ONLY_USER = "read_only"
const MONGO_URL = `mongodb+srv://${READ_ONLY_USER}:${READ_ONLY_PASS}@allocations-3plbs.gcp.mongodb.net/`

const client = new MongoClient(MONGO_URL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
})

const browsers = ['chrome', 'safari']

test.skip('ensure all public links work and speed test', async () => {
  const times = []
  for (const browser of browsers) {
    const driver = await new Builder().forBrowser(browser).build()
    const db = (await client.connect()).db("allocations-dashboard")
    const deals = await db.collection("deals").find({ status: { $ne: "closed" }}).toArray()

    const links = await Promise.all(deals.map(async d => {
      const { slug } = await db.collection("organizations").findOne({ _id: d.organization })
      return [d.slug, slug, `https://dashboard.allocations.com/public/${slug}/deals/${d.slug}?invite_code=${d.inviteKey}`]
    }))

    for (let [deal, fund, link] of links) {
      try {
        let start_ts = Date.now()
        await driver.get(link)
        await driver.wait(until.elementLocated(By.className("Deal")), 5000)
        // console.log(`✅ ${deal} (${fund})`)
        times.push(Date.now() - start_ts)
      } catch (e) {
        console.log(`❌ ${deal} (${fund}), browser: ${browser}`)
        console.log(link)
      } 
    }
      
    await driver.quit()
  }

  const avg_time = times.reduce((n, x) => n + x, 0) / times.length
  console.log("AVG LOAD:", avg_time, "ms")

}, 60000 * 2)