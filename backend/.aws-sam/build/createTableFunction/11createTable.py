
import boto3
import psycopg2
import cfnresponse
import json

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

    cur = engine.cursor() 

    query = ''' CREATE TABLE public.{tableName}( username character varying, file_name character varying, source_language character varying, target_language character varying, status character varying, transcription_key character varying, translation_key character varying,  keyphrases character varying[], description character varying, PRIMARY KEY (username, file_name, target_language) )'''.format(tableName = tableName)
    
    cur.execute(query)

    engine.commit()
    engine.close()


    print (event)
    responseBody = {
    'Status': 'SUCCESS',
    'Reason': 'Table has been created',
    'StackId': event['StackId'],
    'RequestId': event['RequestId'],
    'LogicalResourceId': event['LogicalResourceId'],
    'Data': {
        'Status':'Created'
    }
    }

    print('Response = ' + json.dumps(responseBody))

    
    cfnresponse.send(event, context, cfnresponse.SUCCESS,responseBody, "CustomResourcePhysicalID")

