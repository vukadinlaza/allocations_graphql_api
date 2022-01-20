const { SecretsManager } = require("aws-sdk");

const secretsManager = new SecretsManager({ region: "us-east-1" });

const AWS_ENV_SECRET_NAME = "allocation_graphql_api";

const getAwsSecrets = async () => {
  const { SecretString } = await secretsManager
    .getSecretValue({
      SecretId: `${AWS_ENV_SECRET_NAME}/${process.env.NODE_ENV}`,
    })
    .promise();

  const secrets = JSON.parse(SecretString);

  Object.entries(secrets).forEach(([key, envKey]) => {
    if (!process.env[key]) process.env[key] = envKey;
  });
};

module.exports = getAwsSecrets;
