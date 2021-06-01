import json
import boto3
import logging
import os

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def lambda_handler(event, context):
    logger.setLevel(logging.DEBUG)
    logger.debug('Job ID is: {}' .format(event))
    return(updateDatabase(event))

def updateDatabase(jobid):
    dynamoDB = boto3.client('dynamodb')
    translate = boto3.client('translate')
    s3 = boto3.client('s3')
    
    response = translate.describe_text_translation_job(JobId=jobid)
    
    job_name = response['TextTranslationJobProperties']['JobName']
    
    outputfileurl = response['TextTranslationJobProperties']['OutputDataConfig']['S3Uri']
    targetLanguageCode = response['TextTranslationJobProperties']['TargetLanguageCodes']
    key = split(outputfileurl, '/', 3)[1] + targetLanguageCode[0] + '.' + job_name + '.json.txt'
    
    logger.debug('S3 key is: {}' .format(key))
    
    ddbresponse = dynamoDB.update_item(
            TableName = 'la-presse',
            Key = {
                'job_name' : {'S' : job_name}
                },
            UpdateExpression="SET #P = :t, translateKey = :k",
            ExpressionAttributeValues={
                ':t': {'S':'Translation Complete'},
                ':k': {'S':key}
            },
            ExpressionAttributeNames={
                "#P":"status"
            })
    
    s3response = s3.generate_presigned_url('get_object',
                                             Params={'Bucket': 'la-presse-main-bucket',
                                                      'Key': key},
                                                  ExpiresIn=3600)
    
    print(s3response)
    
    return s3response
    
def split(strng, sep, pos):
    strng = strng.split(sep)
    return sep.join(strng[:pos]), sep.join(strng[pos:])