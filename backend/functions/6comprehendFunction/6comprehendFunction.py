#To comprehend keyphrases using AWS Comprehend

import json
import boto3
import re
  
def lambda_handler(event, context):

    ssm = boto3.client('ssm')
    s3bucketName = ssm.get_parameter(Name = 't2-s3-bucket-name')
    s3bucketName = s3bucketName['Parameter']['Value']
    
    comprehend = boto3.client(service_name='comprehend')
    s3 = boto3.client('s3')

    data = s3.get_object(Bucket=s3bucketName, Key=event)
    contents = data['Body'].read()
    convertedContents = contents.decode("utf-8") 
    splitIntoSpeakers = convertedContents.split("\n")
    payloadString = re.sub('\[\d*:\d*:\d*\]\s.*+(\.||\s)*:\s','',convertedContents)
    keyphrase_list = []
    listOfPayloadStrings = [payloadString]
    
    while True:
        try:
            for j in range (len(listOfPayloadStrings)):
                keyphrases_result = comprehend.batch_detect_key_phrases(TextList=[listOfPayloadStrings[j]], LanguageCode='en')
                for result in keyphrases_result['ResultList'][0]['KeyPhrases']:
                    keyphrase_list.append(result['Text'].replace("'",''))
            break
        except: 
            newListOfPayloadStrings = []
            for string in listOfPayloadStrings:
                split_str = string.split(" ")
                left_str = ""
                right_str = ""
                leng = len(split_str)//2
                for i in range (leng):
                    left_str += split_str[i]
                    right_str += split_str[i+leng]
                    left_str += " "
                    right_str += " "
                newListOfPayloadStrings.append(left_str)
                newListOfPayloadStrings.append(right_str)
            listOfPayloadStrings = newListOfPayloadStrings

    keyphrase_list = eval(str(keyphrase_list).replace("'","\"").replace(r"\n",""))
    
    return keyphrase_list
    

