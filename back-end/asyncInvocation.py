import json
import boto3

def lambda_handler(event, context):
    
    client = boto3.client('lambda')
    dynamoDB = boto3.client('dynamodb')
    
    username = event['username'].split("@")
    
    payload = {
        'username': event['username'],
        'sourceLanguage': event['sourceLanguage'],
        'targetLanguage': event['targetLanguage'],
        'fileName': event['fileName'],
        'job_name': username[0]+"._."+username[1]+"._."+event['fileName'] +"._."+context.aws_request_id+event['targetLanguage']
    }
    
    response = client.invoke(
        FunctionName='la-presse-transcribe-function',
        InvocationType='Event',
        Payload=json.dumps(payload)
        )
    
    response = dynamoDB.put_item(
            TableName = 'la-presse-updated-main-table',
            Item = {
                'fileName' : {
                    'S' : payload['fileName']
                },
                'job_name' : {
                    'S' : payload['job_name']
                },
                'username' : {
                    'S' : payload['username']
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
                    'S' : 'Not started'
                },
                'status' : {
                    'S' : "In Progress"
                }
            }
            )
    print ("respones")
    print (response)
    
    return {
        'statusCode': 200,
        'body': json.dumps(payload['job_name'])
    }
