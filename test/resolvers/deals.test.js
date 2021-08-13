const { gql } = require("apollo-server");
const { ObjectId } = require("mongodb");
const { getDB } = require("../../src/mongo");
const { FUND_DEAL_ID } = require("../fixtures/deals");
const { LOGGED_IN_USER_ID, INVESTOR_USER_ID } = require("../fixtures/users");
const { describeWithServer, testError } = require("../setup");

const GET_DEAL = gql`
  query GetDeal($id: String!) {
    deal(_id: $id) {
      _id
      investments {
        _id
      }
      organization {
        _id
        slug
      }
      approved
      dealParams {
        valuation
      }
      appLink
      publicLink
      raised
      viewedUsers {
        _id
      }
      AUM
    }
  }
`;

const GET_ALL_DEALS = gql`
  query GetDeals {
    allDeals {
      _id
      investments {
        _id
      }
      organization {
        _id
        slug
      }
      approved
      appLink
      publicLink
      raised
      viewedUsers {
        _id
      }
      AUM
    }
  }
`;

const SEARCH_DEALS = gql`
  query SearchDeals($q: String!, $limit: Int) {
    searchDeals(q: $q, limit: $limit) {
      _id
    }
  }
`;

const SEARCH_DEALS_BY_ORG = gql`
  query SearchDealsByOrg($q: String!, $org: String!, $limit: Int) {
    searchDealsByOrg(q: $q, org: $org, limit: $limit) {
      _id
    }
  }
`;

const PUBLIC_DEAL = gql`
  query PublicDeal(
    $deal_slug: String!
    $fund_slug: String!
    $invite_code: String
  ) {
    publicDeal(
      deal_slug: $deal_slug
      fund_slug: $fund_slug
      invite_code: $invate_code
    ) {
      _id
    }
  }
`;

const FUND_ADMIN_HIGHLIGHTS = gql`
  query FundAdminHighlights {
    fundAdminHighlights
  }
`;

const CREATE_DEAL = gql`
  mutation CreateDeal($org: String!, $deal: DealInput!) {
    createDeal(org: $org, deal: $deal) {
      _id
      company_name
      slug
    }
  }
`;

const UPDATE_DEAL = gql`
  mutation UpdateDeal($org: String!, $deal: DealInput!) {
    updateDeal(org: $org, deal: $deal) {
      _id
    }
  }
`;

const DELETE_DEAL = gql`
  mutation DeleteDeal($id: String!) {
    deleteDeal(_id: $id)
  }
`;

const CREATE_ORG_AND_DEAL = gql`
  mutation CreateOrgAndDeal($orgName: String!, $deal: DealInput!) {
    createOrgAndDeal(orgName: $orgName, deal: $deal) {
      _id
    }
  }
`;

const ADD_USER_AS_VIEWED = gql`
  mutation AddUserAsViewed($deal_id: String!, $user_id: String!) {
    addUserAsViewed(deal_id: $deal_id, user_id: $user_id) {
      _id
    }
  }
`;

const DELETE_USER_AS_VIEWED = gql`
  mutation DeleteUserAsViewed($deal_id: String!, $user_id: String!) {
    deleteUserAsViewed(deal_id: $deal_id, user_id: $user_id) {
      _id
    }
  }
`;

describeWithServer(
  "Deals",
  ({
    executeOperationAsAdmin,
    executeOperationAsFundAdmin,
    executeOperationAsInvestor,
    executeOperationAsLoggedIn,
    executeOperation,
  }) => {
    describe("GET_DEAL", () => {
      test("logged in user can get a deal by id", async () => {
        expect(
          await executeOperationAsLoggedIn({
            query: GET_DEAL,
            variables: { id: FUND_DEAL_ID },
          })
        ).toMatchSnapshot();
      });

      testError("non-user cannot get a deal", () => {
        expect(
          executeOperation({
            query: GET_DEAL,
            variables: { id: FUND_DEAL_ID },
          })
        ).rejects.toMatchSnapshot();
      });
    });

    describe("GET_ALL_DEALS", () => {
      test("admin users can get all deals", async () => {
        expect(
          await executeOperationAsAdmin({ query: GET_ALL_DEALS })
        ).toMatchSnapshot();
      });

      testError("non-admin user cannot get all deals", async () => {
        expect(
          await executeOperationAsLoggedIn({ query: GET_ALL_DEALS })
        ).toMatchSnapshot();
      });
    });

    describe("SEARCH_DEALS", () => {
      test("admin users can search for deals", async () => {
        expect(
          await executeOperationAsAdmin({
            query: SEARCH_DEALS,
            variables: { q: "eST-DE" },
          })
        ).toMatchSnapshot();
      });

      testError("non-admin users cannot search ", async () => {
        expect(
          await executeOperationAsFundAdmin({
            query: SEARCH_DEALS,
            variables: { q: "eST-DE", limit: 0 },
          })
        ).toMatchSnapshot();
      });
    });

    describe("SEARCH_DEALS_BY_ORG", () => {
      test("fund admin users can search for deals by org", async () => {
        expect(
          await executeOperationAsFundAdmin({
            query: SEARCH_DEALS_BY_ORG,
            variables: { q: "TEST", org: "cool-fund" },
          })
        ).toMatchSnapshot();
      });

      testError(
        "non fund admin users cannot search for deals by org",
        async () => {
          expect(
            await executeOperationAsInvestor({
              query: SEARCH_DEALS_BY_ORG,
              variables: { q: "TEST", org: "cool-fund" },
            })
          ).toMatchSnapshot();
        }
      );
    });

    //! this is skipped because public deal uses operationName (which is not a secure way to expose public operations)
    describe.skip("PUBLIC_DEAL", () => {
      test("anyone can view a public deal", async () => {
        expect(
          await executeOperation({
            query: PUBLIC_DEAL,
            variables: {
              deal_slug: "test-deal",
              fund_slug: "cool-fund",
            },
          })
        ).toMatchSnapshot();
      });
    });

    describe("FUND_ADMIN_HIGHLIGHTS", () => {
      test("logged in users can get highlights", async () => {
        expect(
          await executeOperationAsLoggedIn({
            query: FUND_ADMIN_HIGHLIGHTS,
          })
        ).toMatchSnapshot();
      });
    });

    describe("CREATE_DEAL", () => {
      test("fund admins can create a deal", async () => {
        const db = await getDB();

        await executeOperationAsFundAdmin({
          query: CREATE_DEAL,
          variables: {
            org: "cool-fund",
            deal: {
              company_name: "hello",
            },
          },
        });

        expect(
          await db.deals.findOne({ company_name: "hello" })
        ).toMatchSnapshot({
          _id: expect.any(ObjectId),
          created_at: expect.any(Number),
          inviteKey: expect.any(String),
        });
      });

      testError("non fund admin cannot create a deal", async () => {
        expect(
          await executeOperationAsInvestor({
            query: CREATE_DEAL,
            variables: {
              org: "cool-fund",
              deal: {
                company_name: "hello",
              },
            },
          })
        ).toMatchSnapshot();
      });

      testError("duplicate company names cannot be created", async () => {
        expect(
          await executeOperationAsFundAdmin({
            query: CREATE_DEAL,
            variables: {
              org: "cool-fund",
              deal: {
                company_name: "Test Deal",
              },
            },
          })
        ).toMatchSnapshot();
      });
    });

    describe("UPDATE_DEAL", () => {
      test("fund admins can updatea a deal", async () => {
        const db = await getDB();

        expect(
          await executeOperationAsFundAdmin({
            query: UPDATE_DEAL,
            variables: {
              org: "cool-fund",
              deal: {
                _id: FUND_DEAL_ID,
                company_name: "best-deal",
                dealParams: {
                  managementFees: "3%",
                },
              },
            },
          })
        ).toMatchSnapshot();

        expect(
          await db.deals.findOne({ _id: ObjectId(FUND_DEAL_ID) })
        ).toMatchSnapshot({
          created_at: expect.any(Number),
          updated_at: expect.any(Number),
          inviteKey: expect.any(String),
        });
      });

      test("fund admins can close a deal", async () => {
        const db = await getDB();

        expect(
          await executeOperationAsFundAdmin({
            query: UPDATE_DEAL,
            variables: {
              org: "cool-fund",
              deal: {
                _id: FUND_DEAL_ID,
                status: "closed",
              },
            },
          })
        ).toMatchSnapshot();

        expect(
          await db.deals.findOne({ _id: ObjectId(FUND_DEAL_ID) })
        ).toMatchSnapshot({
          created_at: expect.any(Number),
          updated_at: expect.any(Number),
          inviteKey: expect.any(String),
        });

        expect(
          await db.investments
            .find({ deal_id: ObjectId(FUND_DEAL_ID) })
            .toArray()
        ).toMatchSnapshot();
      });

      testError("non fund admins cannot update a deal", async () => {
        expect(
          await executeOperationAsLoggedIn({
            query: UPDATE_DEAL,
            variables: {
              org: "cool-fund",
              deal: {
                company_name: "best deal",
              },
            },
          })
        ).toMatchSnapshot();
      });
    });

    describe("DELETE_DEAL", () => {
      test("admins can delete deals", async () => {
        const db = await getDB();

        expect(
          await executeOperationAsAdmin({
            query: DELETE_DEAL,
            variables: { id: FUND_DEAL_ID },
          })
        ).toMatchSnapshot();

        expect(
          await db.deals.find({ _id: ObjectId(FUND_DEAL_ID) }).count()
        ).toEqual(0);

        expect(
          await db.investments.find({ deal_id: ObjectId(FUND_DEAL_ID) }).count()
        ).toEqual(0);
      });

      testError("non-admins cannot delete deals", async () => {
        expect(
          await executeOperationAsFundAdmin({
            query: DELETE_DEAL,
            variables: { id: FUND_DEAL_ID },
          })
        ).toMatchSnapshot();
      });
    });

    describe("CREATE_ORG_AND_DEAL", () => {
      test("a logged in user can create an org and a deal", async () => {
        const db = await getDB();

        await executeOperationAsLoggedIn({
          query: CREATE_ORG_AND_DEAL,
          variables: {
            orgName: "A Great Org",
            deal: {
              company_name: "A Good Deal",
            },
          },
        });

        // TODO: test user/org association

        expect(
          await db.organizations.findOne({ name: "A Great Org" })
        ).toMatchSnapshot({
          _id: expect.any(ObjectId),
          created_at: expect.any(Number),
        });
        expect(
          await db.deals.findOne({ company_name: "A Good Deal" })
        ).toMatchSnapshot({
          _id: expect.any(ObjectId),
          organization: expect.any(ObjectId),
          created_at: expect.any(Number),
          inviteKey: expect.any(String),
        });
      });

      testError(
        "a logged in user cannot create a duplicate org and deal",
        async () => {
          expect(
            await executeOperationAsLoggedIn({
              query: CREATE_ORG_AND_DEAL,
              variables: {
                orgName: "Cool Fund",
                deal: {
                  company_name: "A Good Deal",
                },
              },
            })
          ).toMatchSnapshot();
        }
      );

      test("a non-logged in user cannot create an org and deal", async () => {
        expect(
          executeOperation({
            query: CREATE_ORG_AND_DEAL,
            variables: {
              orgName: "A Great Org",
              deal: {
                company_name: "A Good Deal",
              },
            },
          })
        ).rejects.toMatchSnapshot();
      });
    });

    describe("ADD_USER_AS_VIEWED", () => {
      test("a logged in user can view a deal", async () => {
        const db = await getDB();
        await executeOperationAsLoggedIn({
          query: ADD_USER_AS_VIEWED,
          variables: {
            deal_id: FUND_DEAL_ID,
            user_id: LOGGED_IN_USER_ID,
          },
        });

        expect(
          (
            await db.deals.findOne({
              _id: ObjectId(FUND_DEAL_ID),
            })
          ).usersViewed
        ).toEqual([ObjectId(INVESTOR_USER_ID), ObjectId(LOGGED_IN_USER_ID)]);
      });

      test("a logged in user cannot view a deal twice", async () => {
        const db = await getDB();
        await executeOperationAsLoggedIn({
          query: ADD_USER_AS_VIEWED,
          variables: {
            deal_id: FUND_DEAL_ID,
            user_id: INVESTOR_USER_ID,
          },
        });

        expect(
          (
            await db.deals.findOne({
              _id: ObjectId(FUND_DEAL_ID),
            })
          ).usersViewed
        ).toEqual([ObjectId(INVESTOR_USER_ID)]);
      });
    });

    describe("DELETE_USER_AS_VIEWED", () => {
      test("a logged in user can delete a user view on a deal", async () => {
        const db = await getDB();

        await executeOperationAsLoggedIn({
          query: DELETE_USER_AS_VIEWED,
          variables: {
            deal_id: FUND_DEAL_ID,
            user_id: INVESTOR_USER_ID,
          },
        });

        expect(
          (
            await db.deals.findOne({
              _id: ObjectId(FUND_DEAL_ID),
            })
          ).usersViewed
        ).toEqual([]);
      });
    });
  }
);
