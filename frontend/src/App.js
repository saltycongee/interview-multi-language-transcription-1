import './App.css';
import Amplify, { Auth, Storage } from 'aws-amplify';
import React from 'react';
import { Grid } from "semantic-ui-react";
import Login from "./Components/Authentication/Login";
import { Hub } from "aws-amplify";
import { useState, useEffect } from "react";
import { connect } from "react-redux";
import { updateLoginState } from "./Actions/loginActions";
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import axios from 'axios';
import { useAlert } from 'react-alert'
import { Icon, Label, Menu, Table } from 'semantic-ui-react'
import { getDefaultNormalizer } from '@testing-library/dom';

function App(props) {

  Amplify.configure({
    Auth: {
      identityPoolId: 'us-east-1:154afb63-c1a1-4b7d-b047-7273d030e4bf', //REQUIRED - Amazon Cognito Identity Pool ID
      region: 'us-east-1', // REQUIRED - Amazon Cognito Region
    },
    Storage: {
      AWSS3: {
        bucket: 'la-presse-main-bucket', //REQUIRED -  Amazon S3 bucket name
        region: 'us-east-1', //OPTIONAL -  Amazon service region
      }
    }
  });

  const api = 'https://c4r8tzi2r4.execute-api.us-east-1.amazonaws.com/dev';
  const scanApi = 'https://0opz07581b.execute-api.us-east-1.amazonaws.com/dev';

  const payload = {
    "sourceLanguage": "en",
    "filename": "",
    "targetLanguage": "fr",
    "userid": ""
  };

  const statusPayload = { "username": "" }

  let file;

  function onChange(e) {
    file = e.target.files[0];
  }

  const options = [{ value: 'en', label: 'US English' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' }];

  const { loginState, updateLoginState } = props;

  const [currentLoginState, updateCurrentLoginState] = useState(loginState);

  const [status, updateStatus] = useState({
    showStatus: false
  })

  const [showUploadFormStatus, updateUploadFormStatus] = useState({
    showUploadForm: false
  })

  const [jobState, updateJobState] = useState({
    jobs: []
  })

  async function onSignOut() {
    updateLoginState("signIn");
    await Auth.signOut();
  }

  useEffect(() => {
    setAuthListener();
  }, []);

  useEffect(() => {
    updateCurrentLoginState(loginState);
  }, [loginState]);


  async function setAuthListener() {
    Hub.listen('auth', (data) => {
      switch (data.payload.event) {
        case "signOut":
          updateLoginState("signIn");
          break;
        default:
          break;
      }
    })
  }

  function _sourceLanguageChosen(option) {
    payload['sourceLanguage'] = option.value
    console.log('Source Language ', option.value)
  };

  let job_name;

  function callApi() {
    Auth.currentSession()
      .then(data => {
        payload['userid'] = data['accessToken']['payload']['username']
        axios
          .post(api, payload)
          .then((response) => {
            job_name = response['data']['body']
            statusPayload['job_name'] = job_name.substring(1, job_name.length - 1);
            console.log(statusPayload['job_name'])
            let newJob = jobState.jobs.slice()
            newJob.push(
              {
                'job_name': job_name.substring(1, job_name.length - 1),
                'status': 'In progress',
                'transcriptionUrl': ' ',
                'translateKey': ' ',
                'sourceLanguage': payload['sourceLanguage'],
                'targetLanguage': payload['targetLanguage']
              })
            updateJobState({
              jobs: newJob
            })
            toggleUploadStatus()
          })
          .catch((error) => {
            console.log(error);
          })
      }
      )
  }

  function _targetLanguageChosen(option) {
    payload['targetLanguage'] = option.value
    console.log('Target Language ', option.value)
  };

  async function onSubmit() {
    try {
      await Storage.put(file.name, file, {
        progressCallback(progress) {
          console.log(`Uploaded: ${progress.loaded}/${progress.total}`);

        },
      });
      payload.filename = file.name
      console.log("Calling api...")
      callApi()
    } catch (err) {
      console.log('Error uploading file: ', err);
    }
  }

  const alert = useAlert()

  function showAlert() {
    axios
      .post(scanApi, statusPayload)
      .then((response) => {
        alert.show(response['data']['body'])
        console.log(response)
      })
      .catch((error) => {
        console.log(error);
      })
  }

  function toggleUploadStatus() {
    updateUploadFormStatus({
      showUploadForm: !showUploadFormStatus.showUploadForm
    })
  }


  function fetchData() {
    Auth.currentSession()
      .then(data => {
        statusPayload['username'] = data['accessToken']['payload']['username']
        console.log(statusPayload['username'])
        axios
          .post(scanApi, statusPayload)
          .then((response) => {
            let newJob = JSON.parse(response['data']['body'])
            newJob = newJob['Items']
            console.log(newJob)
            updateJobState({
              jobs: newJob
            })
          })
          .catch((error) => {
            console.log(error);
          })
      })
  }

  async function downloadData(key) {
    const signedURL = await Storage.get(key);
    console.log(signedURL)
    let a = document.createElement('a');
    a.href = signedURL;
    a.download = 'key';
    a.click();
  }

  function showTable() {

    const newRows = jobState.jobs.map((job) => {
      let tokens = job.transcriptionUrl.split('/').slice(4);
      const transcribeKey = tokens.join('/');
      tokens = job.translateKey.split('/').slice(1);
      const translateKey = tokens.join('/');
      return <Table.Row>
        <Table.Cell> {job.job_name} </Table.Cell>
        <Table.Cell>{job.sourceLanguage}</Table.Cell>
        <Table.Cell>{job.targetLanguage}</Table.Cell>
        <Table.Cell> {job.status} </Table.Cell>
        <Table.Cell> {job.transcriptionUrl!= ' ' ?
          <button onClick={() => downloadData(transcribeKey)}> Download
          </button> : "In progress"
        }
        </Table.Cell>
        <Table.Cell> {job.translateKey!= ' ' ?
          <button onClick={() => downloadData(translateKey)}> Download
          </button> : "In progress"
        }
        </Table.Cell>
      </Table.Row>
    }
    )
    return newRows;
  }

  useEffect(() => {
    fetchData()
  }, [])

  function refreshPage() {
    window.location.reload(false);
  }


  return (
    <Grid style={{ width: "100vw", height: "100vh" }}>
      <Grid.Row style={{ width: "100vw", height: "100vh" }}>
        <Grid.Column style={{ width: "100vw", height: "100vh" }}>
          {
            currentLoginState !== "signedIn" && (
              /* Login component options:
              * [animateTitle: true, false]
              * [type: "video", "image", "static"]
              * [title: string]
              * [darkMode (changes font/logo color): true, false]
              * */
              <Login animateTitle={true} type={"video"} title={"Transcribe & Translate"} darkMode={true} />
            )
          }
          {
            currentLoginState === "signedIn" && (
              showUploadFormStatus.showUploadForm ?
                <div className="UploadForm">
                  <p>
                    <Dropdown options={options} onChange={_sourceLanguageChosen} placeholder="Translate from" />
                  </p>
                  <p>
                    <Dropdown options={options} onChange={_targetLanguageChosen} placeholder="Translate to" />
                  </p>
                  <p>
                    <input
                      type="file"
                      onChange={onChange}
                      className="InputFileButton"
                    />
                  </p>
                  {
                    status.showStatus ?
                      <p>
                        <button onClick={showAlert} className="InputFileButton">
                          Check Status
                    </button>
                      </p> : null
                  }
                  <p>
                    <button onClick={onSubmit} className="InputFileButton">Submit</button>
                    {" "}
                    <button onClick={toggleUploadStatus} className="InputFileButton">Go back</button>
                  </p>
                </div> :
                <div>
                  <div className="TableView">
                    <Table celled class="ui inverted black table" className="Table">
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell>Job ID</Table.HeaderCell>
                          <Table.HeaderCell>Source Language</Table.HeaderCell>
                          <Table.HeaderCell>Target Language</Table.HeaderCell>
                          <Table.HeaderCell>Status</Table.HeaderCell>
                          <Table.HeaderCell>Transcription</Table.HeaderCell>
                          <Table.HeaderCell>Translation</Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>

                      <Table.Body>
                        {
                          showTable()
                        }
                      </Table.Body>
                      <Table.Footer>
                        <Table.Row>
                          <Table.HeaderCell colSpan='1'>
                            <Menu floated='right' pagination>
                              <Menu.Item as='a' icon>
                                <Icon name='chevron left' />
                              </Menu.Item>
                              <Menu.Item as='a'>1</Menu.Item>
                              <Menu.Item as='a'>2</Menu.Item>
                              <Menu.Item as='a'>3</Menu.Item>
                              <Menu.Item as='a'>4</Menu.Item>
                              <Menu.Item as='a' icon>
                                <Icon name='chevron right' />
                              </Menu.Item>
                            </Menu>
                          </Table.HeaderCell>
                        </Table.Row>
                      </Table.Footer>
                    </Table>
                    <p className="MenuBar">
                      <button className="InputFileButton" onClick={toggleUploadStatus}>Upload File</button>
                      {" "}
                      <button className="InputFileButton" onClick={refreshPage}>Refresh</button>
                      {" "}
                      <button onClick={onSignOut} className="InputFileButton">Sign Out</button>
                    </p>
                  </div>
                </div>

            )
          }
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
}

const mapStateToProps = (state) => {
  return {
    loginState: state.loginState.currentState,
  };
};

const mapDispatchToProps = {
  updateLoginState,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

