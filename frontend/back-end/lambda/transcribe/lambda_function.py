import json
import boto3
import time
import datetime
from urllib.request import urlopen

def lambda_handler(event, context):
    transcribe = boto3.client("transcribe")
    s3 = boto3.client("s3")
    
    if event:
        file_obj = event["Records"][0]
        bucket_name = str(file_obj["s3"]["bucket"]["name"])
        file_name = str(file_obj["s3"]["object"]["key"])
        s3_url = create_url(bucket_name, file_name)
        file_type = file_name.split(".")[1]
        job_name = context.aws_request_id
        
        transcribe.start_transcription_job(TranscriptionJobName = job_name,
                                           Media = {"MediaFileUri" : s3_url},
                                           MediaFormat = file_type,
                                           LanguageCode = "en-US",
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
        
        s3.put_object(Bucket = bucket_name, Key = "transcribeFiles/{}.json".format(job_name), Body = load_json)
        
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
    
def create_url(bucket_name, file_name):
    return "s3://"+bucket_name+"/"+file_name

