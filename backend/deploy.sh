bucketName=${2}
awsRegion=${4}
awsProfile=${6}
stackName=${8}

sam build

sam package --s3-bucket ${bucketName} --output-template-file out.yaml --profile ${awsProfile:-default}

sam deploy \
  --template-file out.yaml \
  --stack-name ${stackName} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
  --profile ${awsProfile:-default} --region ${awsRegion:-us-west-2}