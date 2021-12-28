const getAwsSecrets = require("./config/secrets");

(async () => {
  await getAwsSecrets();
  const run = require("./app");
  run();
})();
