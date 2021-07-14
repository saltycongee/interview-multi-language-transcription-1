#To comprehend keyphrases using AWS Comprehend

import json
import boto3
import re
 
def lambda_handler(event, context):
    
    comprehend = boto3.client(service_name='comprehend')
    s3 = boto3.client('s3')
    
    print('event')
    print (event)

    data = s3.get_object(Bucket='la-presse-main-bucket', Key=event)
    contents = data['Body'].read()
    
    print(contents)
    
    convertedContents = contents.decode("utf-8") 
    print(convertedContents)
    
    splitIntoSpeakers = convertedContents.split("\n")
    
    payloadString = re.sub('\[\d*:\d*:\d*\]\s[a-zA-Z0-9_]+(\.||\s)*:\s','',convertedContents)
    
    # for text in splitIntoSpeakers:
    #     splitText = text.split(':')
    #     for i in range (3, len(splitText)):
    #         payloadString += splitText[i] 
    #         if (i != (len(splitText)-1)):
    #             payloadString += ':'
    #     payloadString += ' '
    
    print ('payloadString')    
    print (payloadString)
    
    keyphrases_result = comprehend.batch_detect_key_phrases(TextList=[payloadString], LanguageCode='en')
    
    # print('keyphrase_result')
    # print(keyphrases_result)
    
    keyphrase_list = []
    wordsWithoutApostrophe=[]
    wordsWithApostrophe = []
    
    for result in keyphrases_result['ResultList'][0]['KeyPhrases']:
        keyphrase_list.append(result['Text'].replace("'",''))
        
    keyphrase_list = eval(str(keyphrase_list).replace("'","\"").replace(r"\n",""))
    
    print("keyphrase_list")
    print (keyphrase_list)
    
    return keyphrase_list
    
