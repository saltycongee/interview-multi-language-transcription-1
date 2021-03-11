import logo from './logo.svg';
import './App.css';
import Amplify, { Auth, Storage } from 'aws-amplify';
import React, { Component } from 'react';
import { Grid } from "semantic-ui-react";
import Login from "./Components/Authentication/Login";
import PageContainer from "./Views/PageContainer/PageContainer";
import { Hub } from "aws-amplify";
import { useState, useEffect } from "react";
import { connect } from "react-redux";
import { updateLoginState } from "./Actions/loginActions";
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import axios from 'axios';
import { CallToActionSharp } from '@material-ui/icons';


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

  const data = { "language": "en-US" };

  async function onChange(e) {
    const file = e.target.files[0];
    try {
      await Storage.put(file.name, file, {
        progressCallback(progress) {
          console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
        },
      });
    } catch (err) {
      console.log('Error uploading file: ', err);
    }
  }

  const options = [
    'US English', 'Spanish', 'German', 'French'
  ];

  const defaultOption = options[0];

  const { loginState, updateLoginState } = props;

  const [currentLoginState, updateCurrentLoginState] = useState(loginState);

  const style = {
    backgroundColor: 'white',
    font: 'inherit',
    border: '1px solid #ccc',
    padding: '8px',
    cursor: 'pointer'
  };

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
    console.log('Source Language ', option.label)
    callApi()
  };

  function callApi() {
    axios
      .post(api, data)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function _targetLanguageChosen(option) {
    console.log('Target Language ', option.label)
  };

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
                    style={style}
                  />
                </p>
                <p>
                  <button onClick={onSignOut} style={style}>
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


