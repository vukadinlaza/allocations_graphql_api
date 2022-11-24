const { Router } = require("express");
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

module.exports = Router()
  .post("/create-checkout-session", async (req, res) => {
    const prices = await stripe.prices.list();

    let matchingCustomer = await stripe.customers.list({
      email: req.body.email,
    });

    if (!matchingCustomer?.data[0]) {
      matchingCustomer = await stripe.customers.create({
        email: req.body.email,
      });
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
        customer: matchingCustomer.data[0].id,
      });
    }

    const sub = await stripe.subscriptions.create({
      customer: matchingCustomer.data[0].id,
      items: [{ price: prices.data[0].id, quantity: 1 }],
      default_payment_method: paymentMethod.id,
    });

    res.send({ sub });
  })
  .post("/create-payment-intent", async (req, res) => {
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
  });
