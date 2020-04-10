const superAdmin = (org) => ({
  first_name: "Will",
  last_name: "Sheehan",
  email: "superAdmin@allocations.com",
  organizations_admin: [org._id],
  admin: true
})

const fundAdmin = (org) => ({
  first_name: "Warren",
  last_name: "Buffett",
  email: "fundAdmin@allocations.com",
  organizations_admin: [org._id]
})

const investor = (org) => ({
  first_name: "Han",
  last_name: "Solo",
  email: "investor@allocations.com",
  organizations: [org._id]
})

const altInvestor = (org) => ({
  first_name: "Luke",
  last_name: "Skywalker",
  email: "altInvestor@allocations.com",
  organizations: []
})

module.exports = [superAdmin, fundAdmin, investor, altInvestor]