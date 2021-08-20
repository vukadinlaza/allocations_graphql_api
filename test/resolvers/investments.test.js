const { gql } = require("apollo-server");
const { ObjectId } = require("mongodb");
const { getDB } = require("../../src/mongo");
const { SPV_DEAL_ID } = require("../fixtures/deals");
const {
  WIRED_INVESTMENT_ID,
  PENDING_INVESTMENT_ID,
  WIRED_SPV_INVESTMENT_ID,
} = require("../fixtures/investments");
const { INVESTOR_USER_ID } = require("../fixtures/users");
const { describeWithServer, testError } = require("../setup");

const GET_INVESTMENT = gql`
  query GetInvestment($id: String!) {
    investment(_id: $id) {
      _id
      documents {
        path
      }
      value
      deal {
        _id
      }
      investor {
        _id
      }
    }
  }
`;

const GET_INVESTMENTS_LIST = gql`
  query GetInvestmentsList($pagination: PaginationInput!) {
    investmentsList(pagination: $pagination) {
      count
      investments {
        _id
      }
    }
  }
`;

const CREATE_INVESTMENT = gql`
  mutation CreateInvestment($investment: InvestmentInput!) {
    createInvestment(investment: $investment) {
      status
    }
  }
`;

const UPDATE_INVESTMENT = gql`
  mutation UpdateInvestment($investment: InvestmentInput!) {
    updateInvestment(investment: $investment) {
      status
    }
  }
`;

const DELETE_INVESTMENT = gql`
  mutation DeleteInvestment($_id: String!) {
    deleteInvestment(_id: $_id)
  }
`;

describeWithServer(
  "Investments",
  ({
    executeOperationAsAdmin,
    executeOperationAsFundAdmin,
    executeOperationAsInvestor,
    executeOperationAsLoggedIn,
    executeOperation,
  }) => {
    describe("GET_INVESTMENT", () => {
      test("logged in users can get investments", async () => {
        expect(
          await executeOperationAsLoggedIn({
            query: GET_INVESTMENT,
            variables: { id: WIRED_INVESTMENT_ID },
          })
        ).toMatchSnapshot();
      });

      testError("non logged in users cannot get investments", () => {
        expect(
          executeOperation({
            query: GET_INVESTMENT,
            variables: { id: WIRED_INVESTMENT_ID },
          })
        ).rejects.toMatchSnapshot();
      });
    });

    describe("GET_INVESTMENTS_LIST", () => {
      test("admin users can get a paged list of investments", async () => {
        expect(
          await executeOperationAsAdmin({
            query: GET_INVESTMENTS_LIST,
            variables: { pagination: { currentPage: 0, pagination: 1 } },
          })
        ).toMatchSnapshot();

        expect(
          await executeOperationAsAdmin({
            query: GET_INVESTMENTS_LIST,
            variables: { pagination: { currentPage: 1, pagination: 1 } },
          })
        ).toMatchSnapshot();
      });

      testError(
        "non admin users cannot get a paged list of investments",
        async () => {
          expect(
            await executeOperationAsInvestor({
              query: GET_INVESTMENTS_LIST,
              variables: { pagination: { currentPage: 0, pagination: 1 } },
            })
          ).toMatchSnapshot();
        }
      );
    });

    describe("CREATE_INVESTMENT", () => {
      test("logged in users can make investments", async () => {
        const db = await getDB();

        expect(
          await executeOperationAsLoggedIn({
            query: CREATE_INVESTMENT,
            variables: {
              investment: {
                amount: 1000,
                deal_id: SPV_DEAL_ID,
                user_id: INVESTOR_USER_ID,
                status: "onboarded",
              },
            },
          })
        ).toMatchSnapshot();

        expect(await db.investments.findOne({ amount: 1000 })).toMatchSnapshot({
          _id: expect.any(ObjectId),
          created_at: expect.any(Number),
          invited_at: expect.any(Number),
          onboarded_at: expect.any(Number),
        });
      });

      testError("non logged in users cannot make investments", async () => {
        expect(
          executeOperation({
            query: CREATE_INVESTMENT,
            variables: {
              investment: {
                amount: 1000,
                deal_id: SPV_DEAL_ID,
                user_id: INVESTOR_USER_ID,
                status: "onboarded",
              },
            },
          })
        ).rejects.toMatchSnapshot();
      });
    });

    describe("UPDATE_INVESTMENT", () => {
      test("logged in users can update investments", async () => {
        const db = await getDB();

        expect(
          await executeOperationAsLoggedIn({
            query: UPDATE_INVESTMENT,
            variables: {
              investment: {
                _id: PENDING_INVESTMENT_ID,
                amount: 1000,
                status: "wired",
              },
            },
          })
        ).toMatchSnapshot();

        expect(
          await db.investments.findOne({ _id: ObjectId(PENDING_INVESTMENT_ID) })
        ).toMatchSnapshot({
          updated_at: expect.any(Number),
          wired_at: expect.any(Number),
        });
      });

      testError("non logged in users cannot update investments", async () => {
        const db = await getDB();

        expect(
          executeOperation({
            query: UPDATE_INVESTMENT,
            variables: {
              investment: {
                _id: ObjectId(PENDING_INVESTMENT_ID),
                amount: 1000,
                deal_id: SPV_DEAL_ID,
                user_id: INVESTOR_USER_ID,
                status: "onboarded",
              },
            },
          })
        ).rejects.toMatchSnapshot();

        expect(
          await db.investments.findOne({
            _id: ObjectId(PENDING_INVESTMENT_ID),
          })
        ).toMatchSnapshot();
      });
    });

    describe("DELETE_INVESTMENT", () => {
      test("logged in users can delete investments", async () => {
        const db = await getDB();

        expect(
          await executeOperationAsLoggedIn({
            query: DELETE_INVESTMENT,
            variables: { _id: WIRED_INVESTMENT_ID },
          })
        ).toMatchSnapshot();

        expect(
          await db.investments.findOne({ _id: ObjectId(WIRED_INVESTMENT_ID) })
        ).toMatchSnapshot();
      });

      testError("non logged in users cannot delete investments", async () => {
        const db = await getDB();

        expect(
          executeOperation({
            query: DELETE_INVESTMENT,
            variables: { _id: WIRED_INVESTMENT_ID },
          })
        ).rejects.toMatchSnapshot();

        expect(
          await db.investments.findOne({
            _id: ObjectId(WIRED_SPV_INVESTMENT_ID),
          })
        ).toMatchSnapshot();
      });
    });
  }
);
