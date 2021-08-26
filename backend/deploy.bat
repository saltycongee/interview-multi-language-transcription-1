:: deploy3.bat aws-region:<AWS_REGION> aws-profile:<AWS_PROFILE> stack-name:<STACK_NAME> 
:: sam deploy --profile t2-east1-dev --region us-east-1 --stack-name sam8 --s3-bucket t2cftest0
@echo off
SET tempvar1=%~1
SET tempvar2=%~2
SET tempvar3=%~3
SET tempvar4=%~4
SET aws-region=%tempvar1:~11,250%
SET aws-profile=%tempvar2:~12,250%
SET stack-name=%tempvar3:~11,250%
SET bucket-name=%tempvar2:~11,250%

ECHO Deployment region: %aws-region% 

CALL sam build

ECHO sam deploy --profile %aws-profile% --region %aws-region% --stack-name %stack-name% --guided
CALL sam deploy --profile %aws-profile% --region %aws-region% --stack-name %stack-name% --guided