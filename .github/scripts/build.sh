#find or create repository in ECR and set as ECR_REPOSITORY https://us-east-1.console.aws.amazon.com/ecr/repositories?region=us-east-1: 
ECR_REPOSITORY=allocations-graphql-api
docker build --build-arg NPM_TOKEN=$NPM_TOKEN -t $ECR_REGISTRY/$ECR_REPOSITORY:$SHA_IMAGE_TAG .
docker push $ECR_REGISTRY/$ECR_REPOSITORY:$SHA_IMAGE_TAG
