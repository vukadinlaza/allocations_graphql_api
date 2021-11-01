const {
  getReferenceNumber,
  getWireAmount,
} = require("../../../src/utils/newDirections");
const { verifyWebhook } = require("../../../src/auth");

//for verifyWebhook test
const testToken = 1234;
//for getReferenceNumber and getWireAmount tests
const emails = require("./traditionsBankEmails");

describe("New directions webhook util/auth functions", () => {
  //make copy of environment
  const OLD_ENV = process.env;

  beforeEach(() => {
    //clear cache and change token to testing token
    jest.resetModules();
    process.env = { ...OLD_ENV, ZAP_WEBHOOK_TOKEN: 1234 };
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  //getReferenceNumber function
  it("should correctly parse the reference number out of a provided traditions bank email", () => {
    const expectedRefNums = ["00000001", "00000002", "00000003", "00000004"];
    let actualRefNums = [];

    //grab a reference number from each of our 4 provided templates
    expectedRefNums.forEach((_, i) => {
      actualRefNums.push(getReferenceNumber(emails[i]));
    });

    expect(expectedRefNums).toEqual(actualRefNums);
  });

  //getWireAmount function
  it("should correctly parse the wire amount out of a provided traditions bank email", () => {
    const expectedAmounts = [1, 25, 25.5, 250.25];
    let actualAmounts = [];

    //grab an amount from each of our 4 provided templates, convert it to a number for check
    expectedAmounts.forEach((_, i) => {
      actualAmounts.push(Number(getWireAmount(emails[i])));
    });

    expect(expectedAmounts).toEqual(actualAmounts);
  });

  //verifyWebtoken function

  it("Should correctly verify if the provided token matches the one in our environment", () => {
    const verified = verifyWebhook(testToken);

    expect(verified).toBe(true);
  });
});
