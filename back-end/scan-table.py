# To scan and retrun all items to the corresponding username from DDB

import json 
import psycopg2
import boto3

def lambda_handler(event, context):
    
    returnJson = {'Items':[]}
    
    tableSyntax = {
        'username' : '',
        'file_name': '',
        'source_language': '',
        'target_language': '',
        'status': '',
        'transcription_key': '',
        'translation_key': '',
        'keyphrases': '',
        'description': ''
    }
    
    
    tableName = 'lapresse'
    username = event['username']
    
    #Database config
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
    
    
    selectQuery = ''' SELECT * FROM {tableName} WHERE username = '{username}' '''.format(tableName = tableName, username = username)
    
    cur = engine.cursor()
    cur.execute(selectQuery)
    
    response = json.loads(json.dumps(cur.fetchall()))
    print('he')
    print(response)
    print(type(response)) 
    
    for item in response:
        itemDict = tableSyntax.copy()
        print('next')
        print(tableSyntax)
        print(itemDict)
        for index,parameter in enumerate(itemDict):
            itemDict[parameter] = item[index]
        
        print (itemDict)
        
        returnJson['Items'].append(itemDict)
        print(returnJson['Items'])
        
        
  

        
    
    return {
        'statusCode' : 200,
        'body': json.dumps(returnJson)
    }# To scan and retrun all items to the corresponding username from DDB

import json 
import psycopg2
import boto3

def lambda_handler(event, context):
    
    returnJson = {'Items':[]}
    
    tableSyntax = {
        'username' : '',
        'file_name': '',
        'source_language': '',
        'target_language': '',
        'status': '',
        'transcription_key': '',
        'translation_key': '',
        'keyphrases': '',
        'description': ''
    }
    
    
    tableName = 'lapresse'
    username = event['username']
    
    #Database config
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
    
    
    selectQuery = ''' SELECT * FROM {tableName} WHERE username = '{username}' '''.format(tableName = tableName, username = username)
    
    cur = engine.cursor()
    cur.execute(selectQuery)
    
    response = json.loads(json.dumps(cur.fetchall()))
    print('he')
    print(response)
    print(type(response)) 
    
    for item in response:
        itemDict = tableSyntax.copy()
        print('next')
        print(tableSyntax)
        print(itemDict)
        for index,parameter in enumerate(itemDict):
            itemDict[parameter] = item[index]
        
        print (itemDict)
        
        returnJson['Items'].append(itemDict)
        print(returnJson['Items'])
        
        
  

        
    
    return {
        'statusCode' : 200,
        'body': json.dumps(returnJson)
    }