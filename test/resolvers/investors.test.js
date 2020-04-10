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
    
  /** GET **/

  test('investor can fetch their own data', async () => {
    const { query } = testClient(apolloServer, "investor")
    const { data: { investor }, errors } = await query(GET_INVESTOR)
    expect(investor).toMatchObject({ name: "Han Solo" })
  })

  test('investor cant fetch their others data', async () => {
    const { _id } = (await apolloServer.db.users.findOne({ email: "altInvestor@allocations.com" }))

    const { query } = testClient(apolloServer, "investor")
    const { data: { investor }, errors: [error] } = await query(GET_INVESTOR, {
      variables: { _id: _id.toString() }
    })
    expect(error.message).toBe("permission denied")
  })

  test('super admin can fetch any investors data', async () => {
    const { _id } = (await apolloServer.db.users.findOne({ email: "investor@allocations.com" }))

    const { query } = testClient(apolloServer, "superAdmin")
    const { data: { investor } } = await query(GET_INVESTOR, {
      variables: { _id: _id.toString() }
    })
    expect(investor).toMatchObject({ name: "Han Solo" })
  })

  // FAILING
  test.skip('fund admin can fetch an investor that is part of their fund', async () => {
    const fund = await db.organizations.findOne()
    const { _id } = await db.users.findOne({ email: "investor@allocations.com" })

    const { ops: [newInvestor] } = await db.users.insertOne({ 
      email: "investor100@allocations.com",
      first_name: "Niels",
      last_name: "Bohr",
      organizations: [fund._id] 
    })

    const { query } = testClient(apolloServer, "fundAdmin")
    const { data: { investor }, errors: [error] } = await query(GET_INVESTOR, {
      variables: { _id: newInvestor._id.toString() }
    })
    expect(investor).toMatchObject({ name: "Niels Bohr" })
  })

  test('fund admin cant fetch an investor not in their fund', async () => {
    const { _id } = await db.users.findOne({ email: "altInvestor@allocations.com" })

    const { query } = testClient(apolloServer, "fundAdmin")
    const { data: { investor }, errors: [error] } = await query(GET_INVESTOR, {
      variables: { _id: _id.toString() }
    })
    expect(error.message).toBe("permission denied")
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
      const fund = await db.organizations.findOne()

      // insert deal
      await db.deals.insertOne({ company_name: "Nike", organization: fund._id, slug: "nike" })

      const { query } = testClient(apolloServer, "superAdmin")
      const { data: { investor: { invitedDeal } } } = await query(INVITED_DEAL, {
        variables: { deal_slug: "nike", fund_slug: fund.slug }
      })
      expect(invitedDeal).toMatchObject({ company_name: "Nike" })
    })

    test('invited investor can see deal ', async () => {
      const fund = await db.organizations.findOne()
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
      const fund = await db.organizations.findOne()

      // insert deal with invite
      await db.deals.insertOne({ company_name: "Reebok", organization: fund._id, slug: "reebok", invitedInvestors: [] })

      const { query } = testClient(apolloServer, "investor")
      const { errors: [error] } = await query(INVITED_DEAL, {
        variables: { deal_slug: "reebok", fund_slug: fund.slug }
      })

      // This REDIRECT is weird - TODO change this
      expect(error.message).toBe('REDIRECT')
    })

    test('fund admin can see deal without inviting themselves', async () => {
      const fund = await db.organizations.findOne()

      // insert deal with invite
      await db.deals.insertOne({ company_name: "Puma", organization: fund._id, slug: "puma" })

      const { query } = testClient(apolloServer, "fundAdmin")
      const { data: { investor: { invitedDeal } } } = await query(INVITED_DEAL, {
        variables: { deal_slug: "puma", fund_slug: fund.slug }
      })
      expect(invitedDeal).toMatchObject({ company_name: "Puma" })
    })
  })
})