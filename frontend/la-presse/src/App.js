import logo from './logo.svg';
import './App.css';
import Amplify, { Auth, Storage } from 'aws-amplify';
import React, { Component } from 'react';
import { Grid } from "semantic-ui-react";
import Login from "./Components/Authentication/Login";
import { Hub } from "aws-amplify";
import { useState, useEffect } from "react";
import { connect } from "react-redux";
import { updateLoginState } from "./Actions/loginActions";
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import axios from 'axios';
import { Subject } from '@material-ui/icons';

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

  let job_name = ""

  const payload = {
    "sourceLanguage": "en",
    "filename": "",
    "targetLanguage": "fr",
    "userid": ""
  };

  let fileName = ""

  function onChange(e) {
    const file = e.target.files[0];
    onSubmit(file);
  }

  const options = [{ value: 'en', label: 'US English' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'de', label: 'German' }];

  const { loginState, updateLoginState } = props;

  const [currentLoginState, updateCurrentLoginState] = useState(loginState);

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

  function callApi() {
    Auth.currentSession()
      .then(data => {
        payload['userid'] = data['accessToken']['payload']['username']
        axios
          .post(api, payload)
          .then((response) => {
            job_name = response['data']['body']
            console.log(job_name)
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

  async function onSubmit(file) {
    try {
      await Storage.put(file.name, file, {
        progressCallback(progress) {
          console.log(`Uploaded: ${progress.loaded}/${progress.total}`);

        },
      });
      fileName = file.name
      payload.filename = file.name
      console.log("Calling api...")
      callApi()
    } catch (err) {
      console.log('Error uploading file: ', err);
    }
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
              <div className="App">
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
                <p>
                  <button onClick={onSignOut} className="InputFileButton">
                    Sign Out
                  </button>
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


