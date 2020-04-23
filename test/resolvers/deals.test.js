const { gql } = require('apollo-server')
const { testClient, testServer } = require('../setup')

const CREATE_DEAL = gql`
  mutation CreateDeal($org: String!, $deal: DealInput!) {
    createDeal(org: $org, deal: $deal) {
      _id
      company_name
      slug
    }
  }
`

describe('Deal Resolver', () => {
  let apolloServer;
  beforeAll(async () => {
    apolloServer = await testServer()
  })
    
  /** CREATE **/

  test('super admin can create deal', async () => {
    const { query } = testClient(apolloServer, "superAdmin")
    const { data: { createDeal }, errors } = await query(CREATE_DEAL, 
      {
        variables: {
          org: "cool-fund",
          deal: { company_name: "Crazy Test Deal" }
        }
      } 
    )
    expect(createDeal).toMatchObject({ company_name: "Crazy Test Deal", slug: "crazy-test-deal" })
  })

  test('fund admin can create deal', async () => {
    const { query } = testClient(apolloServer, "fundAdmin")
    const { data: { createDeal } } = await query(CREATE_DEAL, 
      {
        variables: {
          org: "cool-fund",
          deal: { company_name: "Numerai" }
        }
      } 
    )
    expect(createDeal).toMatchObject({ company_name: "Numerai" })
  })

  test('investor cant create deal', async () => {
    const { query } = testClient(apolloServer, "investor")
    const { errors: [error] } = await query(CREATE_DEAL, 
      {
        variables: {
          org: "cool-fund",
          deal: { company_name: "Numerai" }
        }
      } 
    )
    expect(error.message).toBe("permission denied")
  })

  test('cant create deal with same slug and org', async () => {
    const { query } = testClient(apolloServer, "fundAdmin")
    const { data: { createDeal } } = await query(CREATE_DEAL, 
      {
        variables: {
          org: "cool-fund",
          deal: { company_name: "Big Deal" }
        }
      }
    )
    expect(createDeal)

    const { errors: [error] } = await query(CREATE_DEAL, 
      {
        variables: {
          org: "cool-fund",
          deal: { company_name: "Big Deal" }
        }
      }
    )
    expect(error.message).toBe("Deal with same name already exists")
  })

})