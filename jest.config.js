const envs = {
  MONGO_URL: "mongodb://localhost:27017"
}

process.env = {...process.env, ...envs}