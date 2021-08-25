# T2 - Transcription & Translation Tool

## Project Overview

The Transcription and Translation tool enables users to upload audio and video files to be transcribed and then translated to their desired language. The audio or video files, the transcriptions and the translations are stored in a S3 bucket. The translation can be edited by the user from the User Interface (UI) incase of any irregularities. The transcripts will then be uploaded to an Amazon Aurora database after using AWS Comprehend to identify the key phrases. This will allow the user to search previously completed translations using key phrases as well and create a database of completed translations.

## Deployment Steps
The application can be deployed from MacOS, Linux, Windows and Windows Subsystem for Linux.

Some system installation requirements before starting deployment:
* Have the repository downloaded into your local directory
* Having the AWS CLI v2 [installed](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) and
  [configured with credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) on your system
* AWS SAM installed on your system, details on the installation can be found 
  [here](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).
* Python3.8 installed and added to PATH (you can select this in the installer), download the 
  installer [here](https://www.python.org/downloads/release/python-387/). 
  Run ```pip install wheel``` in the command line if there are any issues with ```sam build``` resolving dependencies.

1) Open the terminal in the `backend` folder of the repository, and then run the deployment script using the following command using 
   your own parameter values
   
   For Mac, Linux and Windows Subsystem for Linux users:

   ```   
   ---
   ```

   For Windows users:
   ```   
   deploy.bat aws-region:<AWS_REGION> aws-profile:<AWS_PROFILE> stack-name:<STACK_NAME> 
   ```
    
   This step will:
   <ul>
   <li>Create an S3 bucket for deployment</li>
   <li>Use AWS SAM to build the lambda functions, RDS database and required APIs</li>
   <li>Package them into a deployment zip in the S3 bucket</li>
   <li>Deploy them using the cloudformation template, template.yaml </li>
   </ul>

  Once the SAM package has been built, the console will ask for:
  <ul>
  <li> Stack Name </li>
  <li> AWS Region </li>
  <li> S3 Bucket Suffix </li>
  <li> Database Admin Username </li>
  <li> Database Admin Password </li>
  </ul>

  For the remaining questions click Enter to apply the default settings.

  The application is now being deployed using AWS SAM. This step will take arounf 15 minutes.


2) Now follow the [frontend](docs/frontend-README.md) deployment guide and then continue with step 3 once the frontend
   has finished deploying as we wait for a dependency in the frontend. 