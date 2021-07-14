# To update DDB table after translation is completed
# with the URI to translate file and updated progress

import json
import boto3
import logging
import os
import psycopg2

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def lambda_handler(event, context):
    logger.setLevel(logging.DEBUG)
    logger.debug('Job ID is: {}' .format(event['translation_JobId'])) 
    return(updateDatabase(event))

def updateDatabase(event):
         
    #Database config
    ssm = boto3.client('ssm')
    
    
    database = ssm.get_parameter(Name = 'db-name')
    user = ssm.get_parameter(Name = 'db-user')
    port = ssm.get_parameter(Name = 'db-port')
    
    password = ssm.get_parameter(Name = 'db-password', WithDecryption = True)
    host = ssm.get_parameter(Name = 'db-host', WithDecryption = True)

    
    #Database config
    engine = psycopg2.connect(
    database=database['Parameter']['Value'],
    user=user['Parameter']['Value'],
    password=password['Parameter']['Value'],
    host=host['Parameter']['Value'],
    port=port['Parameter']['Value']
    )
    
    tableName = 'lapresse'
    
    translate = boto3.client('translate')
    s3 = boto3.client('s3')
    client = boto3.client('lambda')
    
    #Get jon information from AWS Translate
    response = translate.describe_text_translation_job(JobId=event['translation_JobId'])
    
    username = event['username']
    file_name = event['file_name']
    target_language = event['target_language']
        
    outputfileurl = response['TextTranslationJobProperties']['OutputDataConfig']['S3Uri']
    targetLanguageCode = response['TextTranslationJobProperties']['TargetLanguageCodes']
    key = split(outputfileurl, '/', 3)[1] + targetLanguageCode[0] + '.' + response['TextTranslationJobProperties']['JobName'] + '.json.txt'
    
    logger.debug('S3 key is: {}' .format(key))
    
    
    #Update item in DDB table 
    updateQuery = ''' UPDATE {tableName} SET status = 'Translation Complete', translation_key = '{translation_key}' WHERE username= '{username}' AND file_name ='{fileName}' AND target_language = '{target_language}'  '''.format(username=username, fileName=file_name,target_language= target_language, translation_key=key, tableName=tableName)
    print('updateQuery')
    print(updateQuery)
        
    cur = engine.cursor()
        
    cur.execute(updateQuery)
    
    s3response = s3.generate_presigned_url('get_object',
                                             Params={'Bucket': 'la-presse-main-bucket',
                                                      'Key': key},
                                                  ExpiresIn=3600)
    
    
    
    
    
    engine.commit()
    engine.close()
    
    return key
    
def split(strng, sep, pos):
    strng = strng.split(sep)
    return sep.join(strng[:pos]), sep.join(strng[pos:])
    

