const { sendInvite } = require("../../src/mailers/admin-mailer");

jest.mock("@sendgrid/mail");

describe("admin mailer", () => {
  it("should return an error if no data is provided", async () => {
    expect(await sendInvite()).toEqual({
      status: "error",
    });
  });

  it("should return an error if org data is missing", async () => {
    expect(
      await sendInvite({
        to: "test123@mail.com",
      })
    ).toEqual({
      status: "error",
    });
  });

  it("should send an email", async () => {
    const result = await sendInvite({
      org: {
        name: "305 Ventures",
        slug: "30-ventures",
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
