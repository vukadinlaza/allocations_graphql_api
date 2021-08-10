const ms = require("ms");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const fetch = require("node-fetch");
const { AuthenticationError } = require("apollo-server-express");
const { createUserAccountAndEntity } = require("./utils/createUser");
const Mailer = require("./mailers/mailer");
const signUpTemplate = require("./mailers/templates/sign-up-template");

const client = jwksClient({
  cache: true,
  cacheMaxEntries: 1000,
  cacheMaxAge: ms("30d"),
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
});

const options = {
  domain: process.env.AUTH0_DOMAIN,
  client_id: process.env.AUTH0_KEY,
};

function getKey(header, cb) {
  client.getSigningKey(header.kid, function (err, key) {
    var signingKey = key.publicKey || key.rsaPublicKey;
    cb(null, signingKey);
  });
}

async function verify(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, options, (err, decoded) => {
      if (err) {
        return reject(new AuthenticationError("verify err statement"));
      }
      return resolve(decoded);
    });
  });
}

async function authenticate({ req, db, authToken }) {
  try {
    const token = authToken
      ? authToken
      : (req.headers.authorization || "").slice(7);
    const data = await verify(token);
    const email = data[`${process.env.AUTH0_NAMESPACE}/email`].toLowerCase();
    const user = await db.users.findOne({ email: email });

    if (user) {
      // attaches .orgs to org admins
      if (user.organizations_admin) {
        user.orgs = await db.organizations
          .find({ _id: { $in: user.organizations_admin } })
          .toArray();
      }

      return user;
    }

    // else create user
    // else create user
    const res = await db.users.insertOne({ email: email });
    const newUser = res.ops[0];
    const acctAndEntity = await createUserAccountAndEntity({ db, u: newUser });
    await updateAirtableUsers({ user: newUser });

    const isDemo = ["localhost", "demo"].some((str) =>
      req.headers.origin.includes(str)
    );
    if (isDemo) {
      const emailData = {
        mainData: {
          to: newUser.email,
          from: "support@allocations.com",
          subject: `Welcome to Allocations!`,
        },
        template: signUpTemplate,
      };

      await Mailer.sendEmail(emailData);
    }

    return newUser;
  } catch (e) {
    console.log("authenicate ERROR", e);
    throw new AuthenticationError("authenicate function catch statement");
  }
}

const updateAirtableUsers = async ({ user }) => {
  if (process.env.NODE_ENV === "production") {
    await fetch("https://hooks.zapier.com/hooks/catch/7904699/onvqrx8/", {
      method: "post",
      body: JSON.stringify({
        email: user.email,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        _id: user._id || "",
      }),
      headers: { "Content-Type": "application/json" },
    });
  }
};

module.exports = { verify, authenticate };
