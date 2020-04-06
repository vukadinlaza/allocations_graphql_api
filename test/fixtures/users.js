
const superAdmin = (org) => ({
  first_name: "Will",
  last_name: "Sheehan",
  email: "superAdmin@allocations.com",
  organizations_admin: [org._id],
  admin: true
})

const fundAdmin = (org) => ({
  first_name: "Will",
  last_name: "Sheehan",
  email: "fundAdmin@allocations.com",
  organizations_admin: [org._id]
})

const investor = (org) => ({
  first_name: "Will",
  last_name: "Sheehan",
  email: "investor@allocations.com",
  organizations: [org._id]
})

module.exports = [superAdmin, fundAdmin, investor]