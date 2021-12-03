import json
import boto3
import psycopg2

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
    username = event['username']

    for item in event['deleteItems']:
        deleteData(engine, tableName, username, item['file_name'],item['target_language'], )
    
    engine.commit()
    engine.close()

    proxy_response = {}
    proxy_response['statusCode']=200
    proxy_response["body"] = { 'msg': 'delete function' }

    return setProxyResponse(proxy_response)
    

def deleteData( conn, tableName, username, file_name, target_language) :   
     
    cur1 = conn.cursor() #To check if PK already exists
    cur2 = conn.cursor() #To insert delete item

    
    query = '''SELECT * FROM {tableName} WHERE (username = '{username}') AND (file_name ='{file_name}') AND (target_language='{target_language}') '''.format(username=username, file_name=file_name, target_language=target_language, tableName = tableName)
    deleteQuery = ''' DELETE FROM {tableName} WHERE (username = '{username}') AND (file_name ='{file_name}') AND (target_language='{target_language}') '''.format(username=username, file_name=file_name, target_language=target_language, tableName = tableName)
    
    cur1.execute(query)
    if(cur1.fetchall() != []):
        print("Delete table")
        print(cur1.fetchall())
        cur2.execute(deleteQuery)
    results = cur1.fetchall()
    print('results')
    print (results)
    if(len(results) > 0):
        print('response')
        for row in results:
            
            transcription_key = row[5]
            print (type(row[6]))
            bucketNameSplit = transcription_key.split('/')
            translation_key = str(bucketNameSplit[0]) +'//'+str(bucketNameSplit[2])+'/'+ row[6]
            file_key = str(bucketNameSplit[0]) +'//'+str(bucketNameSplit[2])+'/public/'+ row[1]
            
            print(transcription_key)
            print(translation_key)
            print(file_key)
            
            deleteObject(transcription_key)
            deleteObject(translation_key)
            deleteObject(file_key)

            
        
    
def deleteObject (key):
    print ('key')
    print (key)
    try:
        s3_client = boto3.client('s3')
        response1 = s3_client.delete_object( Bucket='la-presse-main-bucket', Key=key)
        print('done')
        print(response1)
        return True
    except Exception as ex:
        print("FAIL")
        print(str(ex))
        return False

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

