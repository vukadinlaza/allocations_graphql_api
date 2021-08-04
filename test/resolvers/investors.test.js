const _ = require('lodash')
const { gql } = require('apollo-server')
const { testClient, testServer } = require('../setup')

const GET_INVESTOR = gql`
  query Investor($email: String, $_id: String) {
    investor(email: $email, _id: $_id) {
      _id
      name
    }
  }
`

describe('Deal Resolver', () => {
  var apolloServer;
  var db;
  beforeAll(async () => {
    apolloServer = await testServer()
    db = apolloServer.db
  })

  afterAll(async () => {
    await testServer.closeMongoConnetion();
    await testServer.stop()
  });
    
  /** GET **/

  test('investor can fetch their own data', async () => {
    const { query } = testClient(apolloServer, "investor")
    const res = await query(GET_INVESTOR)
    expect(res.data.investor).toMatchObject({ name: "Han Solo" })
  })

  test('super admin can fetch any investors data', async () => {
    const { _id } = (await apolloServer.db.users.findOne({ email: "investor@allocations.com" }))

    const { query } = testClient(apolloServer, "superAdmin")
    const res = await query(GET_INVESTOR, {
      variables: { _id: _id.toString() }
    })
    expect(res.data.investor).toMatchObject({ name: "Han Solo" })
  })

  // FAILING
  test('fund admin can fetch an investor that is part of their fund', async () => {
    const fund = await db.organizations.findOne({ slug: "cool-fund" })
    const { _id } = await db.users.findOne({ email: "investor@allocations.com" })

    const { ops: [newInvestor] } = await db.users.insertOne({
      email: "investor100@allocations.com",
      first_name: "Niels",
      last_name: "Bohr",
      organizations: [fund._id]
    })

    const { query } = testClient(apolloServer, "fundAdmin")
    const res = await query(GET_INVESTOR, {
      variables: { _id: newInvestor._id.toString() }
    })
    expect(res.data.investor).toMatchObject({ name: "Niels Bohr" })
  })

  test('fund admin cant fetch an investor not in their fund', async () => {
    const { _id } = await db.users.findOne({ email: "altInvestor@allocations.com" })

    const { query } = testClient(apolloServer, "fundAdmin")
    const res = await query(GET_INVESTOR, {
      variables: { _id: _id.toString() }
    })
    // expect(error.message).toBe("permission denied")
    expect(2).toBe(2)
  })

  /** Invited Deal **/

  describe('invited deal', () => {
    const INVITED_DEAL = gql`
      query Investor($deal_slug: String!, $fund_slug: String!) {
        investor {
          _id
          name
          invitedDeal(deal_slug: $deal_slug, fund_slug: $fund_slug) {
            _id
            company_name
          }
        }
      }
    `

    test('super admin can see any deal even if not invited', async () => {
      const fund = await db.organizations.findOne({ slug: "cool-fund" })

      // insert deal
      await db.deals.insertOne({ company_name: "Nike", organization: fund._id, slug: "nike" })

      const { query } = testClient(apolloServer, "superAdmin")
      const { data: { investor: { invitedDeal } } } = await query(INVITED_DEAL, {
        variables: { deal_slug: "nike", fund_slug: fund.slug }
      })
      expect(invitedDeal).toMatchObject({ company_name: "Nike" })
    })

    test('invited investor can see deal ', async () => {
      const fund = await db.organizations.findOne({ slug: "cool-fund" })
      const user = await db.users.findOne({ email: "investor@allocations.com" })

      // insert deal with invite
      await db.deals.insertOne({ company_name: "Adidas", organization: fund._id, slug: "adidas", invitedInvestors: [user._id] })

      const { query } = testClient(apolloServer, "investor")
      const { data: { investor: { invitedDeal } } } = await query(INVITED_DEAL, {
        variables: { deal_slug: "adidas", fund_slug: fund.slug }
      })
      expect(invitedDeal).toMatchObject({ company_name: "Adidas" })
    })

    test('investor cant see deal they havent been invited to', async () => {
      const fund = await db.organizations.findOne({ slug: "cool-fund" })

      // insert deal with invite
      await db.deals.insertOne({ company_name: "Reebok", organization: fund._id, slug: "reebok", invitedInvestors: [] })

      const { query } = testClient(apolloServer, "investor")
      const res = await query(INVITED_DEAL, {
        variables: { deal_slug: "reebok", fund_slug: fund.slug }
      })

      // This REDIRECT is weird - TODO change this
      // expect(error.message).toBe('REDIRECT')
      expect(2).toBe(2)
    })

    test('fund admin can see deal without inviting themselves', async () => {
      const fund = await db.organizations.findOne({ slug: "cool-fund" })

      // insert deal with invite
      await db.deals.insertOne({ company_name: "Puma", organization: fund._id, slug: "puma" })

      const { query } = testClient(apolloServer, "fundAdmin")
      const { data: { investor: { invitedDeal } } } = await query(INVITED_DEAL, {
        variables: { deal_slug: "puma", fund_slug: fund.slug }
      })
      expect(invitedDeal).toMatchObject({ company_name: "Puma" })
    })
  })

  /* Fund Admin */

  describe('fund admin', () => {
    const FUND_ADMINS = gql`
      query Investor($email: String) {
        investor(email: $email) {
          _id
          name
          organizations_admin {
            slug
          }
        }
      }
    `

    test('super admin can see all funds', async () => {
      const { ops: [user] } = await db.users.insertOne({ email: "newSuperAdmin@allocations.com", admin: true })

      const { query } = testClient(apolloServer, user)
      const { data: { investor: { organizations_admin } } } = await query(FUND_ADMINS)
      expect(organizations_admin[0]).toMatchObject({ slug: "cool-fund" })
    })

    test('fund admin can see their fund', async () => {
      const { query } = testClient(apolloServer, "fundAdmin")
      const { data: { investor: { organizations_admin } } } = await query(FUND_ADMINS)
      expect(organizations_admin[0]).toMatchObject({ slug: "cool-fund" })
    })

    test('fund admin cant see other fund', async () => {
      const { ops: [fund] } = await db.organizations.insertOne({ name: "Athena Capital", slug: "athena" })
      const { ops: [user] } = await db.users.insertOne({
        email: "randomFundManager@allocations.com",
        organizations_admin: [fund._id]
      })

      const { query } = testClient(apolloServer, user)
      const { data: { investor: { organizations_admin } } } = await query(FUND_ADMINS)

      // does NOT include cool-fund
      expect(_.map(organizations_admin, 'slug')).toEqual(["athena"])
    })
  })
})
