#To upload filename, language and keyphrases to the corresponding usernames table

import psycopg2

def lambda_handler(event, context):
    
    print('event')
    print(event)
    
    #Database config
    engine = psycopg2.connect(
    database="postgres",
    user="postgres",
    password="sathvik7",
    host="database-1-instance-1.cl8bneefxudy.us-east-1.rds.amazonaws.com",
    port='5432'
    )   
    tableName = 'lapresse'

    file_name = event['file_name'] 
    
    #Remove '@' and '.' from username 


    uploadData( engine, event['username'], file_name, event['target_language'], event['keyphrases'] ,tableName )
    engine.commit()
    engine.close()  
      
     

def uploadData( conn, username, file_name, target_language, keyphrases,tableName) :
    
    cur = conn.cursor()
    
    #Update item in DDB table 
    
    updateQuery = '''UPDATE {tableName} SET keyphrases = ARRAY {keyphrases} WHERE (file_name ='{file_name}') AND (username = '{username}') AND (target_language ='{target_language}') '''.format(tableName=tableName, keyphrases=keyphrases, file_name=file_name,username=username,target_language=target_language)
    
    print('updateQuery')
    print(updateQuery)
    
    if (keyphrases != []):
        cur.execute(updateQuery)


    


   
    


    
