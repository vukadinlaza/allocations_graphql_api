const { gql } = require("apollo-server");
const { ObjectId } = require("mongodb");
const { getDB } = require("../../src/mongo");
const { FUND_DEAL_ID } = require("../fixtures/deals");
const { ORGANIZATION_ID } = require("../fixtures/organizations");
const { LOGGED_IN_USER_ID, FUND_ADMIN_USER_ID } = require("../fixtures/users");
const { describeWithServer, testError } = require("../setup");

const GET_ORGANIZATION = gql`
  query GetOrganization($slug: String!) {
    organization(slug: $slug) {
      _id
      deals {
        _id
      }
      deal(_id: "${FUND_DEAL_ID}") {
        company_name
      }
      n_deals
      investors {
        _id
      }
      investments {
        _id
      }
      adminInvites {
        to
      }
      approved
    }
  }
`;

const GET_ORGANIZATION_MEMBERS = gql`
  query GetOrganizationMembers($slug: String!) {
    organizationMembers(slug: $slug) {
      _id
    }
  }
`;

const GET_PAGINATED_ORGANIZATIONS = gql`
  query GetPaginatedOrganizations($pagination: PaginationInput!) {
    pagOrganizations(pagination: $pagination) {
      count
      organizations {
        _id
      }
    }
  }
`;

const GET_OVERVIEW_DATA = gql`
  query GetOverviewData($slug: String!) {
    overviewData(slug: $slug)
  }
`;

const CREATE_ORGANIZATION = gql`
  mutation CreateOrganization($org: OrganizationInput!) {
    createOrganization(organization: $org) {
      name
      slug
      approved
      admins {
        _id
      }
    }
  }
`;

const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization($org: OrganizationInput!) {
    updateOrganization(organization: $org) {
      name
      slug
      approved
    }
  }
`;

const ADD_ORGANIZATION_MEMBERSHIP = gql`
  mutation AddOrganizationMembership($slug: String!, $user_id: String!) {
    addOrganizationMembership(slug: $slug, user_id: $user_id) {
      _id
    }
  }
`;

const REVOKE_ORGANIZATION_MEMBERSHIP = gql`
  mutation RevokeOrganizationMembership($slug: String!, $user_id: String!) {
    revokeOrganizationMembership(slug: $slug, user_id: $user_id) {
      _id
    }
  }
`;

describeWithServer(
  "Organizations",
  ({
    executeOperationAsAdmin,
    executeOperationAsFundAdmin,
    executeOperationAsInvestor,
    executeOperationAsLoggedIn,
    executeOperation,
  }) => {
    describe("GET_ORGANIZATION", () => {
      test("admin users can get an organization", async () => {
        expect(
          await executeOperationAsAdmin({
            query: GET_ORGANIZATION,
            variables: { slug: "cool-fund" },
          })
        ).toMatchSnapshot();
      });

      test("fund admin users can get an organization", async () => {
        expect(
          await executeOperationAsFundAdmin({
            query: GET_ORGANIZATION,
            variables: { slug: "cool-fund" },
          })
        ).toMatchSnapshot();
      });

      testError("non fund admin users cannot get an organization", async () => {
        expect(
          await executeOperationAsInvestor({
            query: GET_ORGANIZATION,
            variables: { slug: "cool-fund" },
          })
        ).toMatchSnapshot();
      });
    });

    describe("GET_ORGANIZATION_MEMBERS", () => {
      test("admin users can get all orginization members", async () => {
        expect(
          await executeOperationAsAdmin({
            query: GET_ORGANIZATION_MEMBERS,
            variables: { slug: "cool-fund" },
          })
        ).toMatchSnapshot();
      });

      testError(
        "non admin users cannot get all orginization members",
        async () => {
          expect(
            await executeOperationAsFundAdmin({
              query: GET_ORGANIZATION_MEMBERS,
              variables: { slug: "cool-fund" },
            })
          ).toMatchSnapshot();
        }
      );
    });

    describe("GET_PAGINATED_ORGANIZATIONS", () => {
      test("admin users can get paginated organization results", async () => {
        expect(
          await executeOperationAsAdmin({
            query: GET_PAGINATED_ORGANIZATIONS,
            variables: { pagination: { pagination: 2, currentPage: 0 } },
          })
        ).toMatchSnapshot();
      });

      testError(
        "non-admin users cannot get paginated organization results",
        async () => {
          expect(
            await executeOperationAsFundAdmin({
              query: GET_PAGINATED_ORGANIZATIONS,
              variables: { pagination: { pagination: 2, currentPage: 0 } },
            })
          ).toMatchSnapshot();
        }
      );
    });

    describe("GET_OVERVIEW_DATA", () => {
      test("logged in users can get overview data", async () => {
        expect(
          await executeOperationAsLoggedIn({
            query: GET_OVERVIEW_DATA,
            variables: { slug: "cool-fund" },
          })
        ).toMatchSnapshot();
      });

      // TODO: skipped because of permissions issues
      test.skip("non logged in users can get overview data", async () => {
        expect(
          await executeOperation({
            query: GET_OVERVIEW_DATA,
            variables: { slug: "cool-fund" },
          })
        ).toMatchSnapshot();
      });
    });

    describe("CREATE_ORGANIZATION", () => {
      test("admin users can create organizations", async () => {
        const db = await getDB();

        expect(
          await executeOperationAsAdmin({
            query: CREATE_ORGANIZATION,
            variables: {
              org: {
                name: "Test Org",
                slug: "test-org",
                approved: true,
              },
            },
          })
        ).toMatchSnapshot();

        expect(
          await db.organizations.findOne({ slug: "test-org" })
        ).toMatchSnapshot({
          _id: expect.any(ObjectId),
          created_at: expect.any(Number),
        });
      });

      testError("non-admin users can create organizations", async () => {
        const db = await getDB();

        expect(
          await executeOperationAsLoggedIn({
            query: CREATE_ORGANIZATION,
            variables: {
              org: {
                name: "Test Org",
                slug: "test-org",
                approved: true,
              },
            },
          })
        ).toMatchSnapshot();

        expect(
          await db.organizations.findOne({ slug: "test-org" })
        ).toMatchSnapshot();
      });
    });

    describe("UPDATE_ORGANIZATION", () => {
      test("fund admin users can update an organization", async () => {
        const db = await getDB();

        expect(
          await executeOperationAsFundAdmin({
            query: UPDATE_ORGANIZATION,
            variables: {
              org: {
                _id: ORGANIZATION_ID,
                slug: "cool-org",
                approved: false,
                name: "OK Org",
              },
            },
          })
        ).toMatchSnapshot();

        expect(
          await db.organizations.findOne({ slug: "cool-org" })
        ).toMatchSnapshot({
          updated_at: expect.any(Number),
        });
      });

      testError(
        "non fund admin users cannot update an organization slug",
        async () => {
          const db = await getDB();

          expect(
            await executeOperationAsInvestor({
              query: UPDATE_ORGANIZATION,
              variables: {
                org: {
                  _id: ORGANIZATION_ID,
                  slug: "my-fund",
                },
              },
            })
          ).toMatchSnapshot();

          expect(
            await db.organizations.findOne({ slug: "cool-fund" })
          ).toMatchSnapshot();
        }
      );
    });

    describe("ADD_ORGANIZATION_MEMBERSHIP", () => {
      test("admin users can add users to an organization", async () => {
        const db = await getDB();

        expect(
          await executeOperationAsAdmin({
            query: ADD_ORGANIZATION_MEMBERSHIP,
            variables: { slug: "cool-fund", user_id: LOGGED_IN_USER_ID },
          })
        ).toMatchSnapshot();

        expect(
          await db.users.findOne({ _id: ObjectId(LOGGED_IN_USER_ID) })
        ).toMatchSnapshot();
      });

      testError(
        "non admin users cannot add users to an organization",
        async () => {
          const db = await getDB();

          expect(
            await executeOperationAsFundAdmin({
              query: ADD_ORGANIZATION_MEMBERSHIP,
              variables: { slug: "cool-fund", user_id: LOGGED_IN_USER_ID },
            })
          ).toMatchSnapshot();

          expect(
            await db.users.findOne({ _id: ObjectId(LOGGED_IN_USER_ID) })
          ).toMatchSnapshot();
        }
      );
    });

    describe("REVOKE_ORGANIZATION_MEMBERSHIP", () => {
      test("admin users can remove users from an organization", async () => {
        const db = await getDB();

        expect(
          await executeOperationAsAdmin({
            query: REVOKE_ORGANIZATION_MEMBERSHIP,
            variables: { slug: "cool-fund", user_id: FUND_ADMIN_USER_ID },
          })
        ).toMatchSnapshot();

        expect(
          await db.users.findOne({ _id: ObjectId(FUND_ADMIN_USER_ID) })
        ).toMatchSnapshot();
      });

      testError(
        "non admin users cannot remove users from an organization",
        async () => {
          const db = await getDB();

          expect(
            await executeOperationAsLoggedIn({
              query: ADD_ORGANIZATION_MEMBERSHIP,
              variables: { slug: "cool-fund", user_id: FUND_ADMIN_USER_ID },
            })
          ).toMatchSnapshot();

          expect(
            await db.users.findOne({ _id: ObjectId(FUND_ADMIN_USER_ID) })
          ).toMatchSnapshot();
        }
      );
    });
  }
);
