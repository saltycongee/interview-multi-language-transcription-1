import json
import boto3

def lambda_handler(event, context):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('la-presse-updated-main-table')
    username = event['username']
    print(username)
    print(event['username'])
    
    response = table.scan(ExpressionAttributeValues={
                            ':a': username
                            },
                            FilterExpression="username = :a"
    )
    
    print(response)
    
    return {
        'statusCode' : 200,
        'body': json.dumps(response)
    }
