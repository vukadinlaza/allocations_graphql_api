const { sendConfirmation } = require("../../src/mailers/signing-complete");

jest.mock("@sendgrid/mail");

describe("signing complete mailer", () => {
  it("should return an error if no data is provided", async () => {
    expect(await sendConfirmation()).toEqual({
      status: "error",
    });
  });

  it("should return an error if deal data is missing", async () => {
    expect(
      await sendConfirmation({
        to: "test123@mail.com",
      })
    ).toEqual({
      status: "error",
    });
  });

  it("should send an email", async () => {
    const result = await sendConfirmation({
      deal: {
        company_name: "305 Ventures",
      },
      to: "test123@mail.com",
    });

    expect(result).toEqual({
      status: "sent",
      sent_at: expect.any(Number),
      to: result.to,
    });
  });
});
