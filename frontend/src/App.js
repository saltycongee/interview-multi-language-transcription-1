import "./App.css";
import Amplify, { Auth, Storage } from "aws-amplify";
import React from "react";
import {
  Grid,
  Button,
  Header,
  Icon,
  Menu,
  Table,
  Modal,
  Form,
  TextArea,
  Segment,
} from "semantic-ui-react";
import Login from "./Components/Authentication/Login";
import { Hub } from "aws-amplify";
import { useState, useEffect } from "react";
import { connect } from "react-redux";
import { updateLoginState } from "./Actions/loginActions";
import "react-dropdown/style.css";
import axios from "axios";
import { useAlert } from "react-alert";
import Dropdown from "react-dropdown";

function App(props) {
  // From AWS
  Amplify.configure({
    Auth: {
      identityPoolId: "us-east-1:154afb63-c1a1-4b7d-b047-7273d030e4bf", //REQUIRED - Amazon Cognito Identity Pool ID
      region: "us-east-1", // REQUIRED - Amazon Cognito Region
    },
    Storage: {
      AWSS3: {
        bucket: "la-presse-main-bucket", //REQUIRED -  Amazon S3 bucket name
        region: "us-east-1", //OPTIONAL -  Amazon service region
      },
    },
  });

  const api = "https://c4r8tzi2r4.execute-api.us-east-1.amazonaws.com/dev";
  const scanApi = "https://0opz07581b.execute-api.us-east-1.amazonaws.com/dev";
  const searchApi =
    "https://3wzc0n9cbb.execute-api.us-east-1.amazonaws.com/Stage_1";

  // Initialisations

  const payload = {
    sourceLanguage: "",
    fileName: "",
    targetLanguage: "",
    username: "",
  };

  const searchPayload = {
    username: "",
    targetLanguage: "",
  };

  const statusPayload = { username: "" };
  const options = [
    { value: "en", label: "US English" },
    { value: "fr", label: "French" },
    { value: "es", label: "Spanish" },
    { value: "de", label: "German" },
  ];

  let file;
  let job_name;
  let translateStatus = " ";

  let allowedExts = ["flac", "mp3", "mp4", "ogg", "webm", "amr", "wav"];

  //States

  const { loginState, updateLoginState } = props;

  const [currentLoginState, updateCurrentLoginState] = useState(loginState);

  const [status, updateStatus] = useState({
    showStatus: false,
  });



  const [showUploadFormStatus, updateUploadFormStatus] = useState({
    showUploadForm: false,
  });

  const [showSearchPageStatus, updateSearchPageStatus] = useState(false)
  const [searchedFiles, updateSearchedFiles] = useState([])
  const [showAllStatus, updateShowAllStatus] = useState(true)

  const [maxPerPage, updateMaxPerPage] = useState(2)
  const [currentPage, updateCurrentPage] = useState(1)
  const [totalPages, updateTotalPages] = useState(1)

  const [showKeyphraseSearchStatus, updateKeyphraseSearchStatus] =
    useState(false);
  const [keyphrase, updateKeyphrase] = useState(" ");

  const [translationEditorStatus, updateTranslationEditorStatus] = useState({
    showEditor: false,
    primaryKey: "",
    sortKey: "",
    translateData: "",
    currentFilename: "",
  });

  const [translationData, updateTranslationData] = useState(" ");
  const [translationKey, updateTranslationKey] = useState("");
  const [fileStatus, updateFileStatus] = useState(true);

  const showEditor = translationEditorStatus.showEditor;
  //const primaryKey = translationEditorStatus.primaryKey;
  //const sortKey = translationEditorStatus.sortKey;
  //const translateData = translationEditorStatus.translateData;
  //const currentFilename = translationEditorStatus.currentFilename;

  const [jobState, updateJobState] = useState({
    jobs: [],
  });

  useEffect(() => {
    setAuthListener();
  }, []);

  useEffect(() => {
    updateCurrentLoginState(loginState);
  }, [loginState]);

  useEffect(() => {
    fetchData();
  }, []);

  function onFileChange(e) {
    file = e.target.files[0];
    let fileName = file.name;
    let fileExt = fileName.substring(
      fileName.lastIndexOf(".") + 1,
      fileName.length
    );
    if (allowedExts.indexOf(fileExt) !== -1) {
      updateFileStatus(true);
    } else {
      updateFileStatus(false);
    }
  }

  async function onSignOut() {
    updateLoginState("signIn");
    await Auth.signOut();
  }

  async function setAuthListener() {
    Hub.listen("auth", (data) => {
      switch (data.payload.event) {
        case "signOut":
          updateLoginState("signIn");
          break;
        default:
          break;
      }
    });
  }

  function _sourceLanguageChosen(option) {
    payload["sourceLanguage"] = option.value;
    //console.log("Source Language ", option.value);
  }

  function callApi() {
    //console.log("payload");
    //console.log(payload);
    Auth.currentSession().then((data) => {
      payload["username"] = data["accessToken"]["payload"]["username"];
      axios
        .post(api, payload)
        .then((response) => {
          job_name = response["data"]["body"];
          //.log("response");
          //console.log(response);
          statusPayload["job_name"] = job_name.substring(
            1,
            job_name.length - 1
          );
          //console.log(statusPayload["job_name"]);
          let newJob = jobState.jobs.slice();
          newJob.push({
            username: payload["username"],
            fileName: payload["fileName"],
            job_name: job_name.substring(1, job_name.length - 1),
            status: "In progress",
            transcriptionUrl: " ",
            translateKey: " ",
            sourceLanguage: payload["sourceLanguage"],
            targetLanguage: payload["targetLanguage"],
          });
          updateJobState({
            jobs: newJob,
          });
          toggleUploadStatus();
        })
        .catch((error) => {
          //console.log(error);
        });
    });
  }

  function _targetLanguageChosen(option) {
    payload["targetLanguage"] = option.value;
    //console.log("Target Language ", option.value);
  }

  function _searchTargetLanguageChosen(option) {
    searchPayload["targetLanguage"] = option.value;
    //console.log("Target Language ", option.value);
  }

  async function onSubmit() {
    try {
      await Storage.put(file.name, file, {
        progressCallback(progress) {
          //console.log(`Uploaded: (${progress.loaded}/${progress.total})`);
        },
      });
      payload.fileName = file.name;
      //console.log("Calling api...");
      callApi();
    } catch (err) {
      //console.log("Error uploading file: ", err);
    }
  }

  const alert = useAlert();

  function searchKeyphrases() {
    console.log("keyphrase");
    console.log(keyphrase);
    Auth.currentSession().then((data) => {
      searchPayload["username"] = data["accessToken"]["payload"]["username"];
      const finalSearchPayload = {
        username: searchPayload["username"],
        translateTarget: searchPayload["targetLanguage"],
        keyphrase: keyphrase,
      };
      axios
        .post(searchApi, finalSearchPayload)
        .then((response) => {
          updateSearchedFiles(response['data'])
          updateShowAllStatus(false)
          
          console.log(searchedFiles);

          
        })
        .catch((error) => {
          console.log(error);
        });
      updateKeyphraseSearchStatus(!showKeyphraseSearchStatus);
    });
  }

  function showAlert() {
    axios
      .post(scanApi, statusPayload)
      .then((response) => {
        alert.show(response["data"]["body"]);
        //console.log(response);
        //console.log(response);
      })
      .catch((error) => {
        //console.log(error);
      });
  }

  function toggleUploadStatus() {
    updateUploadFormStatus({
      showUploadForm: !showUploadFormStatus.showUploadForm,
    });
  }

  function fetchData() {
    Auth.currentSession().then((data) => {
      statusPayload["username"] = data["accessToken"]["payload"]["username"];
      //console.log(statusPayload["username"]);
      axios
        .post(scanApi, statusPayload)
        .then((response) => {
          let newJob = JSON.parse(response["data"]["body"]);
          newJob = newJob["Items"];
          //console.log(newJob);
          updateJobState({
            jobs: newJob,
          });
        })
        .catch((error) => {
          console.log(error);
        });
    });
  }

  async function downloadData(key) {
    const signedURL = await Storage.get(key);
    let a = document.createElement("a");
    a.href = signedURL;
    a.download = "key";
    //console.log(a);
    a.click();
  }

  async function editTranslation(key) {
    portalStatus(true);
    updateTranslationKey(key);
    //console.log(key)
    const signedURL = await Storage.get(key, {
      download: true,
      cacheControl: "no-cache",
    });
    signedURL.Body.text().then((string) => {
      updateTranslationData(string);
    });
    //console.log(translationData)
  }

  async function handleTranslationUpload() {
    const key = translationKey;
    //console.log(key)

    const result = await Storage.put(key, translationData, {
      progressCallback(progress) {
        console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
      },
    });
    editTranslation(key);
    portalStatus(false);
    //console.log("result")
    console.log(result)
    //console.log(translationData)
  }

  function portalStatus(portalState) {
    //console.log("portalstatus changed");
    //console.log(showEditor);
    updateTranslationEditorStatus((prevState) => {
      return { ...prevState, showEditor: portalState };
    });
  }

  function showPanigation(){
    var returnString = []
    for (let i = 0; i <= totalPages; i++){
      returnString.push(<Menu.Item as="a" onClick={() => updateCurrentPage(  i  )}>  i  </Menu.Item>)
      }


    console.log(returnString)
    return returnString
  }

  const handleTranslationChange = (event) => {
    updateTranslationData(event.target.value);
    console.log("called");
  };

  const handleKeyphraseChange = (event) => {
    updateKeyphrase(event.target.value);
    console.log("called");
  };

  function showTable() {
    if (searchedFiles === []){
    updateTotalPages(Math.ceil((jobState.jobs.length)/maxPerPage))
    }
  

    const newRows = jobState.jobs.filter((job, index) => (((showAllStatus === true) && (((index/maxPerPage) < currentPage) && ((index/maxPerPage) >= (currentPage -1)))) ) || (searchedFiles.includes(job["fileName"])) )).map((job) => {
      console.log("job");
      console.log(job);
      let tokens = job.transcriptionUrl.split("/").slice(4);
      const transcribeKey = tokens.join("/");
      tokens = job.translateKey.split("/").slice(1);
      const translateKey = tokens.join("/");

      if (job.translateKey === "In progress") {
        // In progress
        translateStatus = <Icon loading name="spinner" />;
      } else if (job.translateKey === "Invalid") {
        //Not applicable
        translateStatus = <Icon color="yellow" name="ban" />;
      } else if (job.translateKey === "Not started") {
        //Not started
        translateStatus = <Icon name="pause circle" />;
      } else {
        translateStatus = (
          <div>
            <Button onClick={() => downloadData(translateKey)}>
              {" "}
              <Icon name="download" />{" "}
            </Button>

            <Button onClick={() => editTranslation(translateKey)}>Edit</Button>
          </div>
        );
      }

      return (
        <Table.Row>
          <Table.Cell> {job.fileName} </Table.Cell>
          <Table.Cell>{job.sourceLanguage}</Table.Cell>
          <Table.Cell>{job.targetLanguage}</Table.Cell>
          <Table.Cell> {job.status} </Table.Cell>
          <Table.Cell>
            {" "}
            {job.transcriptionUrl !== " " ? (
              <Button onClick={() => downloadData(transcribeKey)}>
                {" "}
                <Icon name="download" />
              </Button>
            ) : (
              <Icon loading name="spinner" />
            )}
          </Table.Cell>
          <Table.Cell> {translateStatus}</Table.Cell>
        </Table.Row>
      );
    });
    return newRows;
  }

  function refreshPage() {
    window.location.reload(false);
  }

  return (
    <Grid>
      <Grid.Row>
        <Grid.Column>
          {currentLoginState !== "signedIn" && (
            /* Login component options:
             * [animateTitle: true, false]
             * [type: "video", "image", "static"]
             * [title: string]
             * [darkMode (changes font/logo color): true, false]
             * */
            <Login
              animateTitle={true}
              type={"video"}
              title={"T2 - Translate & Transcribe"}
              darkMode={true}
            />
          )}
          {currentLoginState === "signedIn" &&
            (showUploadFormStatus.showUploadForm ? (
              <div className="UploadForm">
                <p>
                  <Header as="h4" inverted color="grey">
                    Translate from
                  </Header>
                  <Dropdown
                    options={options}
                    onChange={_sourceLanguageChosen}
                    placeholder="Choose from dropdown"
                  />
                </p>
                <p>
                  <Header as="h4" inverted color="grey">
                    Translate to:
                  </Header>

                  <Dropdown
                    options={options}
                    onChange={_targetLanguageChosen}
                    placeholder="Choose from dropdown"
                  />
                </p>
                <p>
                  <input
                    type="file"
                    onChange={onFileChange}
                    className="InputFileButton"
                  />
                </p>
                {status.showStatus ? (
                  <p>
                    <Button onClick={showAlert} className="InputFileButton">
                      Check Status
                    </Button>
                  </p>
                ) : null}
                {!fileStatus ? (
                  <p>
                    <Header as="h4" inverted color="grey">
                      Invalid file type!
                    </Header>
                  </p>
                ) : null}
                <p>
                  <Button
                    disabled={!fileStatus}
                    onClick={onSubmit}
                    className="InputFileButton"
                  >
                    Submit
                  </Button>{" "}
                  <Button
                    onClick={toggleUploadStatus}
                    className="InputFileButton"
                  >
                    Go back
                  </Button>
                </p>
              </div>
            ) : (
              <div>
                <div className="TableView">
                  <Table
                    celled
                    class="ui inverted black table"
                    className="Table"
                  >
                    <Table.Header>
                      <Table.Row>
                        <Table.HeaderCell>File Name</Table.HeaderCell>
                        <Table.HeaderCell>Source Language</Table.HeaderCell>
                        <Table.HeaderCell>Target Language</Table.HeaderCell>
                        <Table.HeaderCell>Status</Table.HeaderCell>
                        <Table.HeaderCell>Transcription</Table.HeaderCell>
                        <Table.HeaderCell>Translation</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>

                    <Table.Body>{showTable()}</Table.Body>
                    <Table.Footer>
                      <Table.Row>
                        <Table.HeaderCell colSpan="1">
                          <Menu floated="right" pagination>
                            <Menu.Item as="a" icon>
                              <Icon name="chevron left" />
                            </Menu.Item>
                            <Menu.Item as="a" onClick={() => updateCurrentPage(1)}>1</Menu.Item>
                            <Menu.Item as="a" onClick={() => updateCurrentPage(2)}>2</Menu.Item>
                            {showPanigation()}
                            <Menu.Item as="a" icon>
                              <Icon name="chevron right" />
                            </Menu.Item>
                          </Menu>
                        </Table.HeaderCell>
                      </Table.Row>
                    </Table.Footer>
                  </Table>
                  <p className="MenuBar">
                    <Button
                      className="InputFileButton"
                      onClick={toggleUploadStatus}
                    >
                      Upload File
                    </Button>{" "}
                    <Button className="InputFileButton" onClick={refreshPage}>
                      Refresh
                    </Button>{" "}
                    <Button onClick={onSignOut} className="InputFileButton">
                      Sign Out
                    </Button>{" "}
                    <Button
                      onClick={() =>
                        updateKeyphraseSearchStatus(!showKeyphraseSearchStatus)
                      }
                      className="InputFileButton"
                    >
                      Search
                    </Button>
                  </p>
                  <div>
                    <Modal open={showEditor}>
                      <Segment>
                        Editor
                        <Form>
                          <TextArea
                            value={translationData}
                            onChange={handleTranslationChange}
                          />

                          <Button onClick={handleTranslationUpload}>
                            Upload translation
                          </Button>
                        </Form>
                      </Segment>
                    </Modal>
                  </div>
                  <div>
                    <Modal open={showKeyphraseSearchStatus}>
                      <Segment>
                        Editor 
                        <Button onClick={() => updateKeyphraseSearchStatus(false)} floated={'right'}><Icon name='close'/></Button>
                        <Form>
                        <Dropdown
                        options={options}
                        onChange={_searchTargetLanguageChosen}
                        placeholder="Choose from dropdown"
                      />
                          <TextArea
                            placeholder="Enter keyphrase"
                            onChange={handleKeyphraseChange}
                          />

                          <Button onClick={searchKeyphrases}>Search</Button>

                        </Form>
                      </Segment>
                    </Modal>
                  </div>
                </div>
              </div>
            ))}
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
