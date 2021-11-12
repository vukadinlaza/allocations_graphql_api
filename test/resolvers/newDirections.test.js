const {
  validateDateOfBirth,
  validateEmail,
  validatePhoneNumber,
} = require("../../src/graphql/resolvers/newDirections");
const moment = require("moment");

describe("new directions tests", () => {
  test("validateDateOfBirth", () => {
    // Non iso dates should error
    const mmddyy = "01/21/89";
    expect(() => validateDateOfBirth(mmddyy)).toThrowError(
      "Invalid Date of Birth"
    );
    const MMddyyyy = "November 21 1989";
    expect(() => validateDateOfBirth(MMddyyyy)).toThrowError(
      "Invalid Date of Birth"
    );
    const toYoung = moment().subtract(17, "years").toISOString();
    expect(() => validateDateOfBirth(toYoung)).toThrowError(
      "Must be at least 18 years old"
    );

    // Iso date string should pass
    const iso = moment().subtract(19, "years").toISOString();
    expect(() => validateDateOfBirth(iso)).not.toThrowError("");
  });
  test("validateEmail", () => {
    const missingAt = "somebody.com";
    expect(() => validateEmail(missingAt)).toThrowError("Invalid email");
    const missingDomain = "somebody@gmail";
    expect(() => validateEmail(missingDomain)).toThrowError("Invalid email");

    const validEmail = "somebody@gmail.com";
    expect(() => validateEmail(validEmail)).not.toThrowError("");
  });
  test("validatePhoneNumber", () => {
    const noCountry = "5182226598";
    expect(() => validatePhoneNumber(noCountry)).toThrowError(
      "Invalid Phone Number"
    );
    const noCountryArea = "2226598";
    expect(() => validatePhoneNumber(noCountryArea)).toThrowError(
      "Invalid Phone Number"
    );
    const toManyNumber = "518222659823";
    expect(() => validatePhoneNumber(toManyNumber)).toThrowError(
      "Invalid Phone Number"
    );
    const toFewNumbers = "22265";
    expect(() => validatePhoneNumber(toFewNumbers)).toThrowError(
      "Invalid Phone Number"
    );

    const valid = "15182226598";
    expect(() => validatePhoneNumber(valid)).not.toThrowError("");
  });
});
