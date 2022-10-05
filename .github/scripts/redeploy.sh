kubectl rollout restart deployment/allocations-graphql-api -n $STAGE
kubectl rollout status deployment/allocations-graphql-api -n $STAGE
