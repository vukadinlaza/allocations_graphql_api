const { sendInvite } = require("../../src/mailers/account-invite-mailer");

jest.mock("@sendgrid/mail");

describe("account invite mailer", () => {
  it("should return an error if no data is provided", async () => {
    const result = await sendInvite();
    expect(result).toEqual({
      status: "error",
    });
  });

  it("should return an error if sender data is missing", async () => {
    const result = await sendInvite({
      to: "test123@mail.com",
    });

    expect(result).toEqual({
      status: "error",
    });
  });

  it("should send an email", async () => {
    const result = await sendInvite({
      sender: {
        email: "allocationsuser@allocations.com",
        accountId: "232323232323",
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
