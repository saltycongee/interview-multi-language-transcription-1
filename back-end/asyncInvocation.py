import json
import boto3

def lambda_handler(event, context):
    
    client = boto3.client('lambda')
    dynamoDB = boto3.client('dynamodb')
    
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
    
    response = dynamoDB.put_item(
            TableName = 'la-presse',
            Item = {
                'job_name' : {
                    'S' : payload['job_name']
                },
                'username' : {
                    'S' : payload['userid']
                },
                'sourceLanguage' : {
                    'S' : payload['sourceLanguage']
                },
                'targetLanguage' : {
                    'S' : payload['targetLanguage']
                },
                'transcriptionUrl' : {
                    'S' : ' '
                },
                'translateKey' : {
                    'S' : ' '
                },
                'status' : {
                    'S' : "In Progress"
                }
            }
            )
    
    return {
        'statusCode': 200,
        'body': json.dumps(payload['job_name'])
    }
