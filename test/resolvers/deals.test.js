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
`;

const ADD_USER_AS_VIEWED = gql`
  mutation AddUserAsViewed($deal_id: String!, $user_id: String!) {
    addUserAsViewed(deal_id: $deal_id, user_id: $user_id) {
      _id
    }
  }
`

const DELETE_USER_AS_VIEWED = gql`
  mutation DeleteUserAsViewed($deal_id: String!, $user_id: String!) {
    deleteUserAsViewed(deal_id: $deal_id, user_id: $user_id) {
      _id
    }
  }
`

describe('Deal Resolver', () => {
  let apolloServer;
  let testDeal;
  beforeAll(async () => {
    apolloServer = await testServer()

    testDeal = await apolloServer.db.deals.findOne({ slug: "test-deal" })

  })


  afterAll(async () => {
    await testServer.closeMongoConnetion();
    await testServer.stop()
  });

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
    const res = await query(CREATE_DEAL,
      {
        variables: {
          org: "cool-fund",
          deal: { company_name: "Numerai" }
        }
      }
    )
    expect(res.data.createDeal).toMatchObject({ company_name: "Numerai" })
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
  });

  test('adds investor as viewed on deal and updates DB', async () => {
    const { query } = testClient(apolloServer, "investor")

    const user = await apolloServer.db.users.findOne({ email: "investor@allocations.com" })

    await query(ADD_USER_AS_VIEWED,
      {
        variables: {
          user_id: user._id.toString(),
          deal_id: testDeal._id.toString()
        }
      }
    )

    const updatedDeal = await apolloServer.db.deals.findOne({ _id: testDeal._id })

    expect(updatedDeal.usersViewed).toContainEqual(user._id)
    expect(updatedDeal.usersViewed).toBeInstanceOf(Array)
  });

  test('delete investor as viewed on deal and updates DB', async () => {
    const { query } = testClient(apolloServer, "investor")
    const user = await apolloServer.db.users.findOne({ email: "investor@allocations.com" })

    await query(ADD_USER_AS_VIEWED,
      {
        variables: {
          user_id: user._id.toString(),
          deal_id: testDeal._id.toString()
        }
      }
    )

    const deal = await apolloServer.db.deals.findOne({ _id: testDeal._id })
    expect(deal.usersViewed).toContainEqual(user._id)

    await query(DELETE_USER_AS_VIEWED,
      {
        variables: {
          user_id: user._id.toString(),
          deal_id: testDeal._id.toString()
        }
      }
    )

    const updatedDeal = await apolloServer.db.deals.findOne({ _id: testDeal._id })
    expect(updatedDeal.usersViewed).not.toContainEqual(user._id)
  })
  

})
