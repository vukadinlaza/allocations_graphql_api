image=$(kubectl get deploy -n staging allocations-graphql-api -o=jsonpath='{.spec.template.spec.containers[0].image}')
kubectl set image deployment/allocations-graphql-api allocations-graphql-api=$image -n production
kubectl rollout restart -n production deployment/allocations-graphql-api
