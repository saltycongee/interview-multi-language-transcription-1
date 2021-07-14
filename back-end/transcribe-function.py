#S1: Download transcribed file and convert it into plain text file
#S2: Start translation job

import json
import boto3
import time
import datetime
from urllib.request import urlopen
import os
import sys
import uuid
import psycopg2

def lambda_handler(event, context):
    
    
    # event contains:
    #     username
    #     source_language
    #     target_language
    #     file_name
    #     job_name
    #     transcription_url
        
    
    print (event)
    
    #Initialising services
    transcribe = boto3.client("transcribe")
    s3 = boto3.client("s3")
    
    #Database config
    ssm = boto3.client('ssm')
    database = ssm.get_parameter(Name = 'db-name')
    user = ssm.get_parameter(Name = 'db-user')
    port = ssm.get_parameter(Name = 'db-port')
    password = ssm.get_parameter(Name = 'db-password', WithDecryption = True)
    host = ssm.get_parameter(Name = 'db-host', WithDecryption = True)

    engine = psycopg2.connect(
    database=database['Parameter']['Value'],
    user=user['Parameter']['Value'],
    password=password['Parameter']['Value'],
    host=host['Parameter']['Value'],
    port=port['Parameter']['Value']
    )
    tableName = 'lapresse'
    

    
    
    username = event['username']
    source_language = event['source_language']
    target_language = event['target_language']
    file_name = event['file_name']
    fileLocation = "s3://la-presse-main-bucket/public/"
    BUCKET_NAME = "la-presse-main-bucket"
    job_name = event['job_name']
    
    #Due to inconsistencies in language codes for AWS Transcribe and Translate,
    #only language code is spereazted from the dealect code only for some cases
    dashCodeLanguages = ['fr-CA'] 
    if source_language not in dashCodeLanguages:
        source_language_translate = source_language.split('-')[0]
    else:
        source_language_translate = source_language
        
    transcribe = boto3.client('transcribe')
    status = transcribe.get_transcription_job(TranscriptionJobName = job_name)
    print(status)
    transcription_status = status['TranscriptionJob']['TranscriptionJobStatus']
    transcription_key = ''
    print(transcription_status)
    if (transcription_status == 'COMPLETED'):
        transcription_key = status['TranscriptionJob']['Transcript']['TranscriptFileUri']
    print(transcription_key)

    
    #load_url = urlopen(status["TranscriptionJob"]["Transcript"]["TranscriptFileUri"])
    load_url = urlopen(transcription_key)
    load_json = json.dumps(json.load(load_url))
    
    print('load_json')
    print (load_json)
    
    s3.put_object(Bucket = BUCKET_NAME, Key = "transcribeFiles/{}.json".format(job_name), Body = load_json)
    
    
    key = "transcribeFiles/{}.json".format(job_name)
    localkey=os.path.basename(key)
    txtfile='public/plainTextFiles/'+job_name+'/'+localkey+'.txt'
    download_path = '/tmp/{}'.format(localkey)
    upload_path = '/tmp/{}.txt'.format(localkey)
    
    s3.download_file(BUCKET_NAME,key,download_path)
    convert_transcript(download_path,upload_path)
    
    s3.upload_file(upload_path, '{}'.format(BUCKET_NAME), txtfile)
    
    folderUrl = "s3://la-presse-main-bucket/public/plainTextFiles/"+job_name+"/"
    
    #Check to skip translation
    if (source_language != target_language):
        translate_JobId = translate_file(folderUrl,source_language_translate,target_language, job_name, file_name, username)
        currentStatus = 'Transcription complete, translation in progress...'
        translation_key = 'In progress'
        
    else:
        currentStatus = 'Transcription complete.'
        translation_key = 'Invalid'
    
    fileUrl = folderUrl+job_name+".json.txt"
    
    #Update item in DDB table 
    updateQuery = ''' UPDATE {tableName} SET status = '{status}', transcription_key = '{transcription_key}', translation_key = '{translation_key}' WHERE username= '{username}' AND file_name ='{fileName}' AND target_language = '{target_language}'  '''.format(username=username, fileName=file_name,target_language= target_language, status= currentStatus, transcription_key=fileUrl, translation_key=translation_key, tableName=tableName)
    print('updateQuery')
    print(updateQuery)
    
    cur = engine.cursor()
    
    cur.execute(updateQuery)
    
    engine.commit()
    engine.close()

    
    return translate_JobId
     
        
#Getting plain text        
def convert_transcript(infile,outfile):
    print ("file_name: ", infile)
    with open(outfile,'w+') as w:
            with open(infile) as f:
                    data=json.loads(f.read())
                    try:
                        labels = data['results']['speaker_labels']['segments']
                        speaker_start_times={}
                        for label in labels:
                                for item in label['items']:
                                        speaker_start_times[item['start_time']] =item['speaker_label']
                        items = data['results']['items']
                        lines=[]
                        line=''
                        time=0
                        speaker='null'
                        i=0
                        for item in items:
                                i=i+1
                                content = item['alternatives'][0]['content']
                                if item.get('start_time'):
                                        current_speaker=speaker_start_times[item['start_time']]
                                elif item['type'] == 'punctuation':
                                        line = line+content
                                if current_speaker != speaker:
                                        if speaker:
                                                lines.append({'speaker':speaker, 'line':line, 'time':time})
                                        line=content
                                        speaker=current_speaker
                                        time=item['start_time']
                                elif item['type'] != 'punctuation':
                                        line = line + ' ' + content
                        lines.append({'speaker':speaker, 'line':line,'time':time})
                        sorted_lines = sorted(lines,key=lambda k: float(k['time']))
                        for line_data in sorted_lines:
                                line='[' + str(datetime.timedelta(seconds=int(round(float(line_data['time']))))) + '] ' + line_data.get('speaker') + ': ' + line_data.get('line')
                                w.write(line + '\n\n')
                    except KeyError:
                        w.write(data['results']['transcripts'][0]['transcript'])
                        

#Submitting file for translation            
def translate_file(fileUrl, source_language, target_language, job_name, file_name, username):
    translate = boto3.client("translate")

    responseFromTrans = translate.start_text_translation_job(JobName=job_name,
                                        InputDataConfig={'S3Uri': fileUrl, 'ContentType': 'text/plain'},
                                        OutputDataConfig={'S3Uri': 's3://la-presse-main-bucket/public/translateFiles/'},
                                        DataAccessRoleArn='arn:aws:iam::313039493322:role/la-presse-translate-role',
                                        SourceLanguageCode=source_language,
                                        TargetLanguageCodes=[target_language]
                                        )
    
    print ('trans response')
    print (responseFromTrans['JobId'])
    
    return (responseFromTrans['JobId'])
   
#Starting step function    
# def start_state_machine(username, file_name, translationJobId, translationStatus, target_language):
#     stateMachine = boto3.client("stepfunctions")
#     input = {'username': username, 'file_name': file_name, 'jobId':translationJobId, 'status': translationStatus, 'target_language': target_language}
    
#     stepFunctionResponse = stateMachine.start_execution(
#         stateMachineArn = 'arn:aws:states:us-east-1:313039493322:stateMachine:La-Presse',
#         name = translationJobId,
#         input = json.dumps(input)
#         )
    
    
        

