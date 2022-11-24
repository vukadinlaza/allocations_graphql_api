const { Router } = require("express");
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

module.exports = Router()
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
      const { amount } = req.body;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (e) {
      next(e);
    }
  });
