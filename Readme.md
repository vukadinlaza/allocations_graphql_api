# Allocations GraphQL API <!-- omit in toc -->

This is the GraphQL Service that provides data to the [Allocations Dashboard](https://github.com/Allocations/allocations_react_dashboard).

## Contents <!-- omit in toc -->

- [Tech Stack](#tech-stack)
- [Set Up Instructions](#set-up-instructions)
  - [Prerequisites:](#prerequisites)
- [Install and Run](#install-and-run)

## Tech Stack

- [Nodejs](gttps://nodejs.org/en/) - JavaScript runtime
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/) - GraphQL Server
- [MongoDB](https://docs.mongodb.com/) - Cloud Database
- [Express](https://expressjs.com/en/4x/api.html) - Nodejs web framework
- [Jest](https://jestjs.io/docs/27.0/getting-started) - Testing framework
- [eslint](https://eslint.org/docs/developer-guide/nodejs-api) - Code linting

---

## Set Up Instructions

### Prerequisites:

- To install packages, you'll need an allocations npm username and password. Then, log in to npm. Please reach out to your manager if you do not already have access to the Allocations npm organization.

```bash
$ npm login

Username:

$ <your-user-name>

Password:

$ <your-npm-password>
```

- We use yarn for package management - [yarn installation instructions](https://classic.yarnpkg.com/en/docs/install#debian-stable)
  - [NPM and Yarn commands comparison](https://classic.yarnpkg.com/en/docs/migrating-from-npm/#toc-cli-commands-comparison)
- A `.npmrc` file must NOT be present in this repo to run or start the service
- A `.env` file is currently required to start the service. Please reach out in the #dev channel for access to this file.

---

## Install and Run

```bash
# Install Node packages listed in package.json
$ yarn install

# run
$ yarn start

#run the with nodemon
$ yarn start:watch
```

The server can be reached at: http://localhost:4000/graphql

---
