#To upload filename, language and keyphrases to the corresponding usernames table

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
    file_name = event['file_name'] 

    uploadData( engine, event['username'], file_name, event['target_language'], event['keyphrases'] ,tableName )
    engine.commit()
    engine.close()  

def uploadData( conn, username, file_name, target_language, keyphrases,tableName) :
    cur = conn.cursor()
    #Update item in DDB table 
    updateQuery = '''UPDATE {tableName} SET keyphrases = ARRAY {keyphrases} WHERE (file_name ='{file_name}') AND (username = '{username}') AND (target_language ='{target_language}') '''.format(tableName=tableName, keyphrases=keyphrases, file_name=file_name,username=username,target_language=target_language)

    if (keyphrases != []):
        cur.execute(updateQuery)


    


   
    


    
