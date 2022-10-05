for s in $(echo `cat deployconfig.json` | jq -r "to_entries|map(\"\(.key)=\(.value|tostring)\")|.[]" ); do
  export $s
done

if [ $STAGE = "staging" ]
then
  export base_url=https://static.allocations.sh
  export branch=staging
else
  export base_url=https://static.allocations.dev
  export branch=master
fi

sha=$(git rev-parse $branch)
ECR_REGISTRY=046746691294.dkr.ecr.us-east-1.amazonaws.com
#find or create repository in ECR and set as ECR_REPOSITORY https://us-east-1.console.aws.amazon.com/ecr/repositories?region=us-east-1:
ECR_REPOSITORY=allocations-graphql-api
export IMAGE=$ECR_REGISTRY/$ECR_REPOSITORY:$sha

if [ $type = "next" ]
then
  export next_patch_url=$base_url/ymls/next/full.yml
else
  export next_patch_url=$base_url/ymls/next/empty.yml
fi

if [ $production_scheme = "internet-facing" ] && [ $STAGE = "production" ]
then
  export acl_patch_url=$base_url/ymls/acl/with-waf.yml
else
  export acl_patch_url=$base_url/ymls/acl/without-waf.yml
fi

mkdir -p temp/base
cd temp/base
curl $base_url/ymls/base/kustomization.yml > kustomization.yml
curl $base_url/ymls/base/deployment.yml > deployment.yml

cd .. && mkdir -p overlays/$STAGE
cd overlays/$STAGE
curl $base_url/ymls/overlays/$STAGE/kustomization.yml > kustomization.yml
cp ../../../deployment/custom/patch.yml .
envsubst < kustomization.yml > kustomization.yaml
rm kustomization.yml
kubectl kustomize . > new-deployment.yml
envsubst < new-deployment.yml | kubectl apply -f -

kubectl rollout status deployment/$name -n $STAGE
