import json
import boto3
import psycopg2
import re

def lambda_handler(event, context):
    
    print(event)
    
    ssm = boto3.client('ssm')
    
    
    database = ssm.get_parameter(Name = 'db-name')
    user = ssm.get_parameter(Name = 'db-user')
    port = ssm.get_parameter(Name = 'db-port')
    
    password = ssm.get_parameter(Name = 'db-password', WithDecryption = True)
    host = ssm.get_parameter(Name = 'db-host', WithDecryption = True)

    
    #Database config
    engine = psycopg2.connect(
    database=database['Parameter']['Value'],
    user=user['Parameter']['Value'],
    password=password['Parameter']['Value'],
    host=host['Parameter']['Value'],
    port=port['Parameter']['Value']
    )
    
    tableName = 'lapresse'
    
    #Initialising services
    client = boto3.client('lambda')
    
    
    #Substituting not allowed characters with 'char'
    allowedFileName = re.sub('[^a-zA-Z0-9._-]+','char',event['file_name'])
    print (allowedFileName)

    #Removing '@' from email address
    username = event['username'].split("@")
    
    #Creating job name
    job_name = username[0]+"---"+context.aws_request_id+"---"+event['target_language']
    
    startTranscription(job_name, event['file_name'], event['source_language'])
    
    
    # #Creating payload for PUT request
    # payload = {
    #     'username': event['username'],
    #     'source_language': event['source_language'],
    #     'target_language': event['target_language'],
    #     'file_name': event['file_name'], 
    #     'job_name': username[0]+username[1]+"---"+allowedFileName +"---"+context.aws_request_id+"---"+event['target_language']
    # }
    
    
    # #Invoking transcribe function
    # response = client.invoke(
    #     FunctionName='la-presse-transcribe-function-postgres',
    #     InvocationType='Event',
    #     Payload=json.dumps(payload)
    #     )
    
    
        
    uploadData(engine, tableName, event['username'], event['file_name'],event['source_language'],event['target_language'], event['description'])
    
    engine.commit()
    engine.close()
    
    start_state_machine(event['username'],event['file_name'],job_name, event['target_language'], event['source_language'])
    
    
    return job_name

def uploadData( conn, tableName, username, file_name, source_language, target_language,description) :   
     
    cur1 = conn.cursor() #To check if PK already exists
    cur2 = conn.cursor() #To insert new item if PK doesnt exist
    cur3 = conn.cursor() #To update if PK exists
    
    query = '''SELECT * FROM lapresse WHERE (username = '{username}') AND (file_name ='{file_name}') AND (target_language='{target_language}') '''.format(username=username, file_name=file_name, target_language=target_language)
    insertQuery = ''' INSERT INTO {tableName} (username, file_name, source_language, target_language,description,status) VALUES ('{username}', '{file_name}','{source_language}', '{target_language}','{description}','Transcription in progress')'''.format(tableName=tableName, username=username, file_name=file_name, source_language=source_language, target_language= target_language, description=description)
    replaceQuery = ''' UPDATE {tableName} SET source_language= '{source_language}' ,description = '{description}', translation_key = 'Translation in progress' WHERE (file_name ='{file_name}') AND (username='{username}') AND (target_language='{target_language}') '''.format(tableName=tableName, username=username, file_name=file_name, source_language=source_language, target_language= target_language, description=description)
    
    cur1.execute(query)
    if(cur1.fetchall() == []):
        print(cur1.fetchall())
        cur2.execute(insertQuery)
    else:
        cur3.execute(replaceQuery)

    
def startTranscription (job_name,file_name,source_language):

    #Initialising services
    transcribe = boto3.client("transcribe")
     
    fileLocation = "s3://la-presse-main-bucket/public/"
    BUCKET_NAME = "la-presse-main-bucket"
    
    #To get the file type
    file_type = file_name.rsplit(".",1)[1]
    
    #Starting transcription job
    transcribe.start_transcription_job(TranscriptionJobName = job_name,
                                      Media = {"MediaFileUri" : fileLocation+file_name},
                                      MediaFormat = file_type,
                                      LanguageCode = source_language,
                                      Settings = {'ShowSpeakerLabels': True,
                                                  'MaxSpeakerLabels': 10} 
                                        )
    return job_name
   
#Starting step function    
def start_state_machine(username, file_name, translationJobId, target_language, source_language):
    stateMachine = boto3.client("stepfunctions")
    input = {'username': username, 'file_name': file_name, 'job_name':translationJobId, 'status': '', 'target_language': target_language, 'source_language':source_language}
    
    stateMachine.start_execution(
        stateMachineArn = 'arn:aws:states:us-east-1:313039493322:stateMachine:La-Presse',
        name = translationJobId,
        input = json.dumps(input)
        )
    
