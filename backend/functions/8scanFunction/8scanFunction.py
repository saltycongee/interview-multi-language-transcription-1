# To scan and retrun all items to the corresponding username from DDB

import json 
import psycopg2
import boto3

def lambda_handler(event, context):
    returnJson = {'Items':[]}
    tableSyntax = {
        'username' : '',
        'file_name': '',
        'source_language': '',
        'target_language': '',
        'status': '',
        'transcription_key': '',
        'translation_key': '',
        'keyphrases': '',
        'description': ''
    }
    event = json.loads(event['body'])
    username = event['username']
    ssm = boto3.client('ssm')
    database = ssm.get_parameter(Name = 't2-db-dbname')
    user = ssm.get_parameter(Name = 't2-db-user')
    port = ssm.get_parameter(Name = 't2-db-port')
    tableName = ssm.get_parameter(Name = 't2-db-tablename')
    password = ssm.get_parameter(Name = 't2-db-password', WithDecryption = True)
    host = ssm.get_parameter(Name = 't2-db-host', WithDecryption = True)

    #Database config
    engine = psycopg2.connect(
    database=database['Parameter']['Value'],
    user=user['Parameter']['Value'],
    password=password['Parameter']['Value'],
    host=host['Parameter']['Value'],
    port=port['Parameter']['Value']
    )
    tableName = tableName['Parameter']['Value']
    selectQuery = ''' SELECT * FROM {tableName} WHERE username = '{username}' '''.format(tableName = tableName, username = username)
    
    cur = engine.cursor()
    cur.execute(selectQuery)
    response = json.loads(json.dumps(cur.fetchall()))
    
    for item in response:
        itemDict = tableSyntax.copy()
        for index,parameter in enumerate(itemDict):
            itemDict[parameter] = item[index]
        
        returnJson['Items'].append(itemDict)

    proxy_response = {}
    proxy_response['statusCode']=200
    proxy_response["body"] = returnJson

    return setProxyResponse(proxy_response)
    # return {
    #     'statusCode' : 200,
    #     'body': json.dumps(returnJson)
    # }

def setProxyResponse(data):
        response = {}
        response["isBase64Encoded"] = False
        if "statusCode" in data:
          response["statusCode"] = data["statusCode"]
        else:
          response["statusCode"] = 200
        if "headers" in data:
            response["headers"] = data["headers"]
        else:
            response["headers"] = {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Headers': 'Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token, X-Amz-User-Agent', 
              'Access-Control-Allow-Origin': '*', 
              'Access-Control-Allow-Methods': '*',
              'Access-Control-Allow-Credentials': 'true' 
            } 
        response["body"] = json.dumps(data["body"])
        return response
