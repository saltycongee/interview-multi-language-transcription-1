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


  const rows = []
  let jobs;

  function showTable() {
    Auth.currentSession()
      .then(data => {
        statusPayload['username'] = data['accessToken']['payload']['username']
        console.log(statusPayload['username'])
        axios
          .post(scanApi, statusPayload)
          .then((response) => {
            jobs = JSON.parse(response['data']['body'])
            jobs = jobs['Items']
            console.log(jobs)
            let job;
            for (job in jobs) {
              let r = <Table.Row>
                <Table.Cell> job.job_name.S </Table.Cell>
                <Table.Cell> job.transcriptionUrl.S </Table.Cell>
                <Table.Cell> job.status </Table.Cell>
              </Table.Row>
              rows.push(r)
            }
          })
          .catch((error) => {
            console.log(error);
          })
      })
  }

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
                  {showTable()}
                  <p className="MenuBar">
                    <button className="InputFileButton" onClick={toggleUploadStatus}>Upload File</button>
                    {" "}
                    <button className="InputFileButton" onClick={refreshPage}>Refresh</button>
                    {" "}
                    <button onClick={onSignOut} className="InputFileButton">Sign Out</button>
                  </p>
                  <p>
                    <Table celled>
                      <Table.Header>
                        <Table.Row>
                          <Table.HeaderCell>Job ID</Table.HeaderCell>
                          <Table.HeaderCell>Transcription URL</Table.HeaderCell>
                          <Table.HeaderCell>Status</Table.HeaderCell>
                        </Table.Row>
                      </Table.Header>

                      <Table.Body>
                        {
                          rows
                        }
                      </Table.Body>
                    </Table>
                  </p>
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


