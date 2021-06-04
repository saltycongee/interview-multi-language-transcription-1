import json
import boto3
import time
import datetime
from urllib.request import urlopen
import os
import sys
import uuid

def lambda_handler(event, context):
    transcribe = boto3.client("transcribe")
    s3 = boto3.client("s3")
    dynamoDB = boto3.client("dynamodb")
    
    
    username = event['username']
    
    sourceLanguage = event['sourceLanguage']
    if sourceLanguage == "en":
        sourceLanguageTranscribe = "en-US"
    elif sourceLanguage == "fr":
        sourceLanguageTranscribe = "fr-FR"
    elif sourceLanguage == "es":
        sourceLanguageTranscribe = "es-ES"
    elif sourceLanguage == "de":
        sourceLanguageTranscribe = "de-DE"
    else:
        sourceLanguageTranscribe = "en-US"
    targetLanguage = event['targetLanguage']
    print(sourceLanguageTranscribe)
    print(targetLanguage)
    fileName = event['fileName']
    fileLocation = "s3://la-presse-main-bucket/public/"
    BUCKET_NAME = "la-presse-main-bucket"
    job_name = event['job_name']
    
    if event:
        file_type = fileName.split(".")[1]
        
        
        transcribe.start_transcription_job(TranscriptionJobName = job_name,
                                          Media = {"MediaFileUri" : fileLocation+fileName},
                                          MediaFormat = file_type,
                                          LanguageCode = sourceLanguageTranscribe,
                                          Settings = {'ShowSpeakerLabels': True,
                                                      'MaxSpeakerLabels': 10}
                                            )
        
        while True:
            status = transcribe.get_transcription_job(TranscriptionJobName = job_name)
            if status["TranscriptionJob"]["TranscriptionJobStatus"] in ["COMPLETED", "FAILED"]:
                break
            print("Transcription in progress")
            time.sleep(5)
            
        load_url = urlopen(status["TranscriptionJob"]["Transcript"]["TranscriptFileUri"])
        load_json = json.dumps(json.load(load_url))
        
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
        
        if (sourceLanguage != targetLanguage):
            translate_file(folderUrl,sourceLanguage,targetLanguage, job_name)
            currentStatus = 'Transcription complete, translation in progress...'
            translateKey = 'In progress'
            
        else:
            currentStatus = 'Transcription complete.'
            translateKey = 'Invalid'
        
        
        fileUrl = folderUrl+job_name+".json.txt"
        
        response = dynamoDB.update_item(
            TableName = 'la-presse-updated-main-table',
            Key = {
                'username' : {'S' : username},
                'fileName' : {'S' : fileName}
                },
            UpdateExpression="SET #P = :t, transcriptionUrl = :k, translateKey = :l",
            ExpressionAttributeValues={
                ':t': {'S':currentStatus},
                ':k': {'S':fileUrl},
                ':l': {'S': translateKey}
            },
            ExpressionAttributeNames={
                "#P":"status"
            })
        
        return {
        'statusCode': 200,
        'body': json.dumps(fileUrl)
    }
     
        
        
def convert_transcript(infile,outfile):
    print ("Filename: ", infile)
    with open(outfile,'w+') as w:
            with open(infile) as f:
                    data=json.loads(f.read())
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
        
def translate_file(fileUrl, sourceLanguage, targetLanguage, job_name):
    translate = boto3.client("translate")

    translate.start_text_translation_job(JobName=job_name,
                                        InputDataConfig={'S3Uri': fileUrl, 'ContentType': 'text/plain'},
                                        OutputDataConfig={'S3Uri': 's3://la-presse-main-bucket/public/translateFiles/'},
                                        DataAccessRoleArn='arn:aws:iam::313039493322:role/la-presse-translate-role',
                                        SourceLanguageCode=sourceLanguage,
                                        TargetLanguageCodes=[targetLanguage]
                                        )
    
        

