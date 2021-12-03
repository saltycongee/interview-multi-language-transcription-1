import psycopg2
import json
import boto3

def lambda_handler(event, context):

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
    event = json.loads(event['body'])
    response = findFiles( engine, event['username'], event['translateTarget'], event['keyphrase'] , tableName)
    engine.commit()
    engine.close()

    proxy_response = {}
    proxy_response['statusCode']=200
    proxy_response["body"] = response

    return setProxyResponse(proxy_response)
    
    
#    return response
    
def findFiles( conn, username, language, keyphrase, tableName ) :
    cur = conn.cursor()
    findQuery = '''SELECT file_name FROM {tableName} WHERE '{keyphrase}' = ANY (keyphrases) AND target_language = '{language}' AND username = '{username}' '''.format(username=username, keyphrase=keyphrase, language=language, tableName = tableName)
    cur.execute(findQuery)
    result = cur.fetchone()
    returnList = []
     
    if (result is None):
        returnList.append('None')
    else:
        for i in range (0,len(result)):
            returnList.append(result[i])
            
    return {
        'searchedFiles':returnList,
        'language' : language
        }

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

    
    

    


   
