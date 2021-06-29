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
  const updateTranslationApi =
    "https://ti7db5ed14.execute-api.us-east-1.amazonaws.com/Stage_1";

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
  const targetOptions = [
    { value: "en", label: "US English" },
    { value: "fr", label: "French" },
    { value: "es", label: "Spanish" },
    { value: "de", label: "German" },
    { value: "it", label: "Italian" },
    { value: "pt", label: "Portuguese" },
    { value: "ja", label: "Japanese" },
    { value: "ko", label: "Korean" },
    { value: "hi", label: "Hindi" },
    { value: "ar", label: "Arabic" },
    { value: "zh", label: "Chinese (simplified)" },
    { value: "zh-TW", label: "Chinese (traditional)" },
  ];

  const sourceOptions = [
    { value: "en-US", label: "English (US)" },
    { value: "fr-FR", label: "French (FR)" },
    { value: "af-ZA", label: "Afrikaans" },
    { value: "ar-AE", label: "Arabic (AE)" },
    { value: "ar-SA", label: "Arabic (SA)" },
    { value: "cy-GB", label: "Welsh" },
    { value: "da-DK", label: "Danish" },
    { value: "de-CH", label: "German (CH)" },
    { value: "de-DE", label: "German (DE)" },
    { value: "en-AB", label: "English (AB)" },
    { value: "en-AU", label: "English (AU)" },
    { value: "en-GB", label: "English (GB)" },

    { value: "en-IE", label: "English (IE)" },
    { value: "en-IN", label: "English (IN)" },
    { value: "en-WL", label: "English (WL)" },
    { value: "es-ES", label: "Spanish (ES)" },
    { value: "es-US", label: "Spanish (US)" },
    { value: "fa-IR", label: "Farsi" },
    { value: "fr-CA", label: "French (FR)" },
    { value: "ga-IE", label: "ga-IE" },
    { value: "gd-GB", label: "Gaelic" },
    { value: "he-IL", label: "Hebrew" },

    { value: "hi-IN", label: "Hindi" },
    { value: "id-ID", label: "Indonesian" },
    { value: "it-IT", label: "Italian" },
    { value: "ja-JP", label: "Japanese" },
    { value: "ko-KR", label: "Korean" },
    { value: "ms-MY", label: "Malay" },
    { value: "nl-NL", label: "Dutch" },
    { value: "pt-BR", label: "Portuguese (BR)" },
    { value: "pt-PT", label: "Portuguese (PT)" },
    { value: "ru-RU", label: "Russian" },

    { value: "ta-IN", label: "Tamil" },
    { value: "te-IN", label: "Telugu" },
    { value: "tr-TR", label: "Turkish" },
    { value: "zh-CN", label: "Chinese (S)" },
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

  const [searchedFiles, updateSearchedFiles] = useState([]);
  const [showAllStatus, updateShowAllStatus] = useState(true);

  const [maxPerPage, updateMaxPerPage] = useState(2);
  const [currentPage, updateCurrentPage] = useState(1);
  const [totalPages, updateTotalPages] = useState(1);

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
  const [translationKey, updateTranslationKey] = useState(" ");
  const [translationKeyUsername, updateTranslationKeyUsername] = useState(" ");
  const [translationKeyLanguage, updateTranslationKeyLanguage] = useState("");
  const [translationKeyFileName, updateTranslationKeyFileName] = useState("");

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
          updateSearchedFiles(response["data"]);
          updateShowAllStatus(false);

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

  async function editTranslation(job) {
    portalStatus(true); //Open editor

    updateTranslationKey(job['translateKey']);
    updateTranslationKeyUsername(job['username']); //Update state for current translation data key
    updateTranslationKeyLanguage(job['targetLanguage']);
    updateTranslationKeyFileName(job['fileName']);
    console.log('in edit translate')
    console.log(job)
    console.log(job['translateKey'])
    console.log(job.translateKey)
    console.log(translationKey)

    const signedURL = await Storage.get(job['translateKey'], {
      download: true,
      cacheControl: "no-cache",
    }); //Get txt from S3
    signedURL.Body.text().then((string) => {
      updateTranslationData(string);
    });
    //console.log(translationData)
  }

  async function handleTranslationUpload() {
    console.log('handle')
    const updatePayload = {
      username: translationKeyUsername,
      translateTarget: translationKeyLanguage,
      s3url: translationKey,
      fileName: translationKeyFileName,
    };

    //console.log(translationKey)

    const result = await Storage.put(translationKey, translationData, {
      progressCallback(progress) {
        console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
      },
    });
    editTranslation(translationKey);
    portalStatus(false);

    axios
      .post(updateTranslationApi, updatePayload)
      .then((response) => {
        console.log("response from update");
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });

    console.log("result from trans upload");
    console.log(result);
  }

  function portalStatus(portalState) {
    updateTranslationEditorStatus((prevState) => {
      return { ...prevState, showEditor: portalState };
    });
  }

  function showPanigation() {
    var returnString = [];
    for (let i = 1; i <= totalPages + 1; i++) {
      returnString.push(
        <Menu.Item
          onClick={() => {
            updateCurrentPage(i);
            console.log(currentPage);
          }}
        >
          {" "}
          {i}{" "}
        </Menu.Item>
      );
    }

    console.log(returnString);
    return returnString;
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
    console.log("total");
    console.log(totalPages);
    console.log("currentPage");
    console.log(currentPage);

    if (searchedFiles === []) {
      try {
        updateTotalPages(Math.ceil(jobState.jobs.length / maxPerPage));
      } catch (err) {
        updateTotalPages(1);
      }

      console.log("total pages");
      console.log(totalPages);
    }

    const newRows = jobState.jobs
      .filter(
        (job, index) =>
          (showAllStatus === true &&
            index / maxPerPage < currentPage &&
            index / maxPerPage >= currentPage - 1) ||
          searchedFiles.includes(job["fileName"])
      )
      .map((job) => {
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
          job.translateKey = translateKey
          translateStatus = (
            <div>
              <Button onClick={() => downloadData(translateKey)}>
                {" "}
                <Icon name="download" />{" "}
              </Button>

              <Button onClick={() => {editTranslation(job)}}>Edit</Button>
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
                    options={sourceOptions}
                    onChange={_sourceLanguageChosen}
                    placeholder="Choose from dropdown"
                    search
                  />
                </p>
                <p>
                  <Header as="h4" inverted color="grey">
                    Translate to:
                  </Header>

                  <Dropdown
                    options={targetOptions}
                    onChange={_targetLanguageChosen}
                    placeholder="Choose from dropdown"
                    search
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
                        <Button
                          onClick={() => portalStatus(false)}
                          floated={"right"}
                          circular
                        >
                          <Icon name="close" />
                        </Button>
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
                        Keyword Search
                        <Button
                          onClick={() => updateKeyphraseSearchStatus(false)}
                          floated={"right"}
                          circular
                        >
                          <Icon name="close" />
                        </Button>
                        <Form>
                          <Dropdown
                            options={targetOptions}
                            onChange={_searchTargetLanguageChosen}
                            placeholder="Choose from dropdown"
                            search
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
