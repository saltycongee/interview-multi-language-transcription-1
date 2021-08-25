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
    username = event['username']

    for item in event['deleteItems']:
        deleteData(engine, tableName, username, item['file_name'],item['target_language'], )
    
    engine.commit()
    engine.close()
    
    

def deleteData( conn, tableName, username, file_name, target_language) :   
    cur1 = conn.cursor() #To check if PK already exists
    cur2 = conn.cursor() #To insert delete item
    query = '''SELECT * FROM {tableName} WHERE (username = '{username}') AND (file_name ='{file_name}') AND (target_language='{target_language}') '''.format(username=username, file_name=file_name, target_language=target_language, tableName = tableName)
    deleteQuery = ''' DELETE FROM {tableName} WHERE (username = '{username}') AND (file_name ='{file_name}') AND (target_language='{target_language}') '''.format(username=username, file_name=file_name, target_language=target_language, tableName = tableName)
    cur1.execute(query)
    if(cur1.fetchall() != []):
        cur2.execute(deleteQuery)
