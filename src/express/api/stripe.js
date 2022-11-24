const { checkToken } = require("@allocations/api-common");
const { Router } = require("express");
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

module.exports = Router()
  .use(checkToken())
  .post("/create-checkout-session", async (req, res, next) => {
    try {
      const prices = await stripe.prices.list();
      let customer;
      const matchingCustomer = await stripe.customers.list({
        email: req.body.email,
      });

      if (!matchingCustomer?.data[0]) {
        customer = await stripe.customers.create({
          email: req.body.email,
        });
      } else {
        customer = matchingCustomer.data[0];
      }

      let paymentMethod;
      if (req.body.payment_type === "card") {
        paymentMethod = await stripe.paymentMethods.create({
          type: "card",
          card: {
            number: req.body.card.number,
            exp_month: req.body.card.exp_month,
            exp_year: req.body.card.exp_year,
            cvc: req.body.card.cvc,
          },
        });

        await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: customer.id,
        });
      }

      if (req.body.payment_type === "us_bank_account") {
        paymentMethod = await stripe.paymentMethods.create({
          type: "us_bank_account",
          us_bank_account: {
            account_number: req.body.us_bank_account.account_number,
            account_holder_name: req.body.us_bank_account.account_holder_name,
          },
        });

        await stripe.paymentMethods.attach(paymentMethod.id, {
          customer: customer.id,
        });
      }

      const sub = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: prices.data[0].id, quantity: req.body.quantity }],
        default_payment_method: paymentMethod.id,
      });

      res.send({ sub });
    } catch (e) {
      next(e);
    }
  })
  .post("/create-payment-intent", async (req, res, next) => {
    // tbd
    try {
      const { amount, email } = req.body;

      let customer;
      const matchingCustomer = await stripe.customers.list({
        email: email,
      });

      customer = matchingCustomer.data[0];

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        customer: customer.id,
        payment_method_types: ["us_bank_account"],
        payment_method_options: {
          us_bank_account: {
            financial_connections: {
              permissions: ["payment_method", "balances"],
            },
          },
        },
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (e) {
      next(e);
    }
  });
