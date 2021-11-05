const { nWithCommas, amountFormat } = require("../../src/utils/common");

describe("Number formatting utils", () => {
  it("takes in a number and adds the correct number of commas to make the number more readible", () => {
    expect(nWithCommas(100000)).toBe("100,000");
    expect(nWithCommas(1000000)).toBe("1,000,000");
    expect(nWithCommas(1)).toBe("1");
    expect(nWithCommas(0.34)).toBe("0.34");
  });

  it("takes in an amount and returns a formatted amount rounded to the nearest 2 decimal places", () => {
    expect(amountFormat(1000.345)).toBe("1,000.35");
    expect(amountFormat(1000000000.23490852039)).toBe("1,000,000,000.23");
    expect(amountFormat(0.34523456)).toBe("0.35");
  });
});
