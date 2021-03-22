import json
import boto3

def lambda_handler(event, context):
    
    client = boto3.client('lambda')
    
    
    payload = {
        'userid': event['userid'],
        'sourceLanguage': event['sourceLanguage'],
        'targetLanguage': event['targetLanguage'],
        'filename': event['filename'],
        'job_name': context.aws_request_id
    }
    
    response = client.invoke(
        FunctionName='la-presse-transcribe-function',
        InvocationType='Event',
        Payload=json.dumps(payload)
        )
    
    return {
        'statusCode': 200,
        'body': json.dumps(payload['job_name'])
    }
