awsRegion=${2}
awsProfile=${4}
stackName=${6}

sam build

sam deploy \
  --template-file out.yaml \
  --stack-name ${stackName} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --profile ${awsProfile:-default} --region ${awsRegion:-us-west-2}