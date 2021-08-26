import boto3
import json

def lambda_handler(event, context):
    transcribe = boto3.client('transcribe')
    status = transcribe.get_transcription_job(TranscriptionJobName = event)
    transcription_status = status['TranscriptionJob']['TranscriptionJobStatus']
    transcription_key = ''
    if (transcription_status == 'COMPLETED'):
        transcription_key = status['TranscriptionJob']['Transcript']['TranscriptFileUri']
    
    return {
        "transcription_status" : transcription_status,
        "transcription_key": transcription_key
        }
        
    
