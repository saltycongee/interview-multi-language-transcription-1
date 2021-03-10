import json
import boto3
import time
import datetime
from urllib.request import urlopen

def lambda_handler(event, context):
    translate = boto3.client("translate")
    s3 = boto3.client("s3")
    
    if event:
        file_obj = event["Records"][0]
        bucket_name = str(file_obj["s3"]["bucket"]["name"])
        file_name = str(file_obj["s3"]["object"]["key"])
        s3_url = create_url(bucket_name, file_name)
        file_type = file_name.split(".")[2]
        job_name = context.aws_request_id
        
        translate.start_text_translation_job(JobName='job_name',
                                             InputDataConfig={'S3Uri': 's3://la-presse-main-bucket/output/', 'ContentType': 'text/plain'},
                                             OutputDataConfig={'S3Uri': 's3://la-presse-main-bucket/translateFiles/'},
                                             DataAccessRoleArn='arn:aws:iam::313039493322:role/la-presse-translate-role',
                                             SourceLanguageCode='en',
                                             TargetLanguageCodes=['fr']
                                             )
        
        
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
    
def create_url(bucket_name, file_name):
    return "s3://"+bucket_name+"/"+file_name
