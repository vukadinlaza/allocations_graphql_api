const { sendEmail } = require("../../src/mailers/mailer");
const mailer = require("@sendgrid/mail");
jest.mock("@sendgrid/mail");

describe("mailer", () => {
  it("should throw if mailer.send() throws", async () => {
    const error = new Error("mailer.send failed");
    jest.spyOn(mailer, "send").mockRejectedValueOnce(error);
    expect(
      await sendEmail({
        mainData: {
          to: "test123@mail.com",
          from: "support@allocations.com",
          subject: "Subject Message",
        },
        template: jest.fn(),
        templateData: {},
      })
    ).toEqual({
      status: "error",
      message: "mailer.send failed",
    });
  });

  it("should return an error if no data is provided", async () => {
    expect(await sendEmail()).toEqual({
      status: "error",
    });
  });

  it("should return an error if template is missing", async () => {
    expect(
      await sendEmail({
        mainData: {
          to: "test123@mail.com",
          from: "support@allocations.com",
          subject: "Subject Message",
        },
      })
    ).toEqual({
      status: "error",
    });
  });

  it("should send an email", async () => {
    const result = await sendEmail({
      mainData: {
        to: "test123@mail.com",
        from: "support@allocations.com",
        subject: "Subject Message",
      },
      template: jest.fn(),
      templateData: {},
    });

    expect(result).toEqual({
      status: "sent",
      sent_at: expect.any(Number),
      to: result.to,
    });
  });
});
