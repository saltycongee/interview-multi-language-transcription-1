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
  Input,
  Label,
  Progress
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
//import mainTable from "./Components/mainTable"

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

  let updatePayload = {
    input: "{}",
    stateMachineArn:
      "arn:aws:states:us-east-1:313039493322:stateMachine:LaPresse-UpdatedTranslations",
  };

  let totalPage = 1;

  // Initialisations

  const payload = {
    source_language: "",
    file_name: "",
    target_language: "",
    username: "",
    description: ""
  };

  const [searchPayload, updateSearchPayload] = useState({
    target_language: "",
  });

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

  const [currentJob, updateJob] = useState({});

  let allowedExts = ["flac", "mp3", "mp4", "ogg", "webm", "amr", "wav"];

  //States

  const { loginState, updateLoginState } = props;

  const [currentLoginState, updateCurrentLoginState] = useState(loginState);

  const [status, updateStatus] = useState({
    showStatus: false,
  });

  const [fileUploadProgress, updateFileUploadProgress] = useState(0)
  const [fileUploadProgressModal, toggleFileUploadProgressModal] = useState(false)

  const [showUploadFormStatus, updateUploadFormStatus] = useState({
    showUploadForm: false,
  });

  const [searchedFiles, updateSearchedFiles] = useState([]);
  const [searchedFilesLanguage, updateSearchedFilesLanguage] = useState('')
  const [showAllStatus, updateShowAllStatus] = useState(true);

  const [maxPerPage, updateMaxPerPage] = useState(8);
  const [currentPage, updateCurrentPage] = useState(1);

  const [submitStatus, updateSubmitStatus] = useState('Submit')

  const [showKeyphraseSearchStatus, updateKeyphraseSearchStatus] =
    useState(false);
  const [keyphrase, updateKeyphrase] = useState(" ");

  const [translationEditorStatus, updateTranslationEditorStatus] = useState({
    showEditor: false,
    primaryKey: "",
    sortKey: "",
    translateData: "",
    currentfile_name: "",
  });


  const [translationData, updateTranslationData] = useState("Loading...");
  const [translationKey, updateTranslationKey] = useState(" ");
  

  const [fileStatus, updateFileStatus] = useState(true);

  const showEditor = translationEditorStatus.showEditor;
  const [showExtraInfo, toggleShowExtraInfo] = useState({
    toggle:false, 
    file_name:'',
    keyphrases:[]
  })

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
    let file_name = file.name;
    let fileExt = file_name.substring(
      file_name.lastIndexOf(".") + 1,
      file_name.length
    );
    if (allowedExts.indexOf(fileExt) !== -1) {
      updateFileStatus(true)
    } else {
      updateFileStatus(false)
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

  function sourceLanguageChosen(option) {
    payload["source_language"] = option.value;
    console.log(option.value)
    //console.log("Source Language ", option.value);
  }


  function callApi() {
    console.log("calling API");
    //console.log(payload);
    Auth.currentSession().then((data) => {
      payload["username"] = data["accessToken"]["payload"]["username"];
      axios
        .post(api, payload)
        .then((response) => {
          job_name = response["data"];
          console.log("response");
          console.log(response);
          statusPayload["job_name"] = job_name
          //console.log(statusPayload["job_name"]);
          let newJob = jobState.jobs.slice();
          newJob.push({
            username: payload["username"],
            file_name: payload["file_name"],
            job_name: job_name.substring(1, job_name.length - 1),
            status: "In progress",
            transcription_key: " ",
            translation_key: " ",
            source_language: payload["source_language"],
            target_language: payload["target_language"],
            description: payload['description'],
            keywords :[]
          });
          updateJobState({
            jobs: newJob,
          });
          toggleUploadStatus();
        })
        .catch((error) => {
          console.log("## ERROR ##")
          console.log(error);
        });
    });
  }

  function targetLanguageChosen(option) {
    payload["target_language"] = option.value;

  }

  function searchTargetLanguageChosen(option) {
    updateSearchPayload((prevState) => {
      return { ...prevState, target_language: option.value };
    });

    console.log("Target Language ", searchPayload);
  }


  async function onSubmit() {
    console.log(payload)
    try {
      await Storage.put(file.name, file, {
        progressCallback(progress) {
          console.log(`Uploaded: (${progress.loaded}/${progress.total})`);
          updateFileUploadProgress((progress.loaded/progress.total)*100)
          console.log(fileUploadProgress)
        },
      });
      payload.file_name = file.name;
      //console.log("Calling api...");
      callApi();
    } catch (err) {
      console.log("Error uploading file: ", err);
    }
    updateFileUploadProgress(0)
    toggleFileUploadProgressModal(false)
  }

  const handleTranslationChange = (event) => {
    updateTranslationData(event.target.value);
  };

  const handleFileNameChange = (event) => {

    console.log(payload['translate_target'])

    payload['description']=event.target.value;
  };

  const alert = useAlert();

  function searchKeyphrases() {
    console.log("keyphrase");
    console.log(keyphrase);
    Auth.currentSession().then((data) => {
      const finalSearchPayload = {
        username: data["accessToken"]["payload"]["username"],
        translateTarget: searchPayload["target_language"],
        keyphrase: keyphrase,
      };
      axios
        .post(searchApi, finalSearchPayload)
        .then((response) => {
          updateSearchedFiles(response["data"]["searchedFiles"]);
          updateShowAllStatus(false);
          updateSearchedFilesLanguage(response["data"]["language"])
          console.log("response")
          console.log(response)
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
          console.log(response);
          let newJob = JSON.parse(response["data"]["body"]);
          console.log(newJob);
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
    console.log(jobState);
    console.log(jobState["jobs"].length);
  }

  async function downloadData(key) {
    console.log(key);
    const signedURL = await Storage.get(key);
    let a = document.createElement("a");
    a.href = signedURL;
    a.download = "key";
    //console.log(a);
    a.click();
  }

  function beforeEditTranslation(job, translation_key) {
    console.log(job);
    job.s3url = translation_key;

    updateJob((prevState) => {
      console.log("in job update");
      return { job };
    });

    console.log(currentJob);

    editTranslation(translation_key);
  }

  async function editTranslation(key) {
    console.log("key");
    console.log(key);
    portalStatus(true); //Open editor
    updateTranslationKey(key);

    const signedURL = await Storage.get(key, {
      download: true,
      cacheControl: "no-cache",
    }); //Get txt from S3
    signedURL.Body.text().then((string) => {
      updateTranslationData(string);
    });
    //console.log(translationData)
  }

  async function handleTranslationUpload() {
    const key = translationKey;
    console.log(currentJob);

    const result = await Storage.put(key, translationData, {
      progressCallback(progress) {
        console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
      },
    });
    editTranslation(key);
    portalStatus(false);

    let translationMetadata = {
      username: currentJob.job.username,
      target_language: currentJob.job.target_language,
      file_name: currentJob.job.file_name,
      s3url: "public/" + currentJob.job.s3url,
    };

    console.log(translationMetadata);
    updatePayload.input = JSON.stringify(translationMetadata);
    console.log(typeof updatePayload.input);

    axios
      .post(updateTranslationApi, updatePayload)
      .then((response) => {
        console.log("response from update");
        console.log(response);
      })
      .catch((error) => {
        console.log("error from update");
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
    for (let i = 1; i <= totalPage; i++) {
      returnString.push(
        <Menu.Item
          onClick={() => {
            updateCurrentPage(i);
          }}
        >
          {" "}
          {i}{" "}
        </Menu.Item>
      );
    }

    return returnString;
  }

  const handleKeyphraseChange = (event) => {
    updateKeyphrase(event.target.value);
  };

  function showTable() {
    console.log(jobState);

    let totalNumberOfFiles = jobState["jobs"].length;
    console.log(jobState["jobs"].length);

    if (totalNumberOfFiles !== 0) {
      totalPage = Math.ceil(jobState["jobs"].length / maxPerPage);
    } else {
      totalPage = 1;
    }

    console.log('searched')
    console.log(showAllStatus)
    console.log(searchedFilesLanguage)

    const newRows = jobState.jobs.slice(0).reverse().filter((job, index) => ((((showAllStatus === true) && (((index/maxPerPage) < currentPage) && ((index/maxPerPage) >= (currentPage -1)))) ) || ((searchedFiles.includes(job["file_name"])) && job['target_language'] === searchedFilesLanguage))).map((job) => {
        console.log(job.translationKey);
        let transcription_tokens = "";
        let translate_tokens = "";
        let transcribeKey = "";
        let translateKey = "";
        let currentKeyphrases = (job.keyphrases === null?['COMPREHEND IS NOT COMPLETE']:job.keyphrases)

        if (job.transcription_key != null) {
          transcription_tokens = job.transcription_key.split("/").slice(4);
          transcribeKey = transcription_tokens.join("/");
        }

        if (job.translation_key != null) {
          translate_tokens = job.translation_key.split("/").slice(1);
          translateKey = translate_tokens.join("/");
        }

        if (
          (job.translation_key === "In progress") ||
          (typeof(job.translation_key) === 'undefined') ||
          (job.translation_key === null)
        ) {
          // In progress
          translateStatus = <Icon loading name="spinner" />;
        } else if (job.translation_key === "Invalid") {
          //Not applicable
          translateStatus = <Icon color="yellow" name="ban" />;
        } else if (job.translation_key === "Not started") {
          //Not started
          translateStatus = <Icon name="pause circle" />;
        } else {
          translateStatus = (
            <div>
              <Button.Group fluid compact>
                <Button onClick={() => downloadData(translateKey)}>
                  {" "}
                  <Icon name="download" />{" "}
                </Button>

                <Button
                  onClick={() => {
                    console.log(job);
                    console.log(currentJob);
                    beforeEditTranslation(job, translateKey);
                  }}
                >
                  {" "}
                  <Icon name="edit" />
                </Button>
              </Button.Group>
            </div>
          );
        }

        return (
          <Table.Row>
          <Table.Cell> {job.file_name} </Table.Cell>
            <Table.Cell> {job.description} </Table.Cell>
            <Table.Cell textAlign="center">{job.source_language}</Table.Cell>
            <Table.Cell textAlign="center">{job.target_language}</Table.Cell>
            <Table.Cell textAlign="center"> {job.status} </Table.Cell>
            <Table.Cell>
              {" "}
              {transcribeKey !== "" ? (
                <Button
                  onClick={() => downloadData(transcribeKey)}
                  compact
                  fluid
                >
                  {" "}
                  <Icon name="download" />
                </Button>
              ) : (
                <Icon loading name="spinner" />
              )}
            </Table.Cell>
            <Table.Cell> {translateStatus}</Table.Cell>
            <Table.Cell> <Button
            onClick={() =>toggleShowExtraInfo(() => {return {toggle: true, file_name : job.file_name, keyphrases: currentKeyphrases };})}
            compact
            fluid
          >
            {" "}
            <Icon name="plus" />
          </Button></Table.Cell>
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
                    onChange={sourceLanguageChosen}
                    placeholder="Choose from dropdown"
                  />
                </p>
                <p>
                  <Header as="h4" inverted color="grey">
                    Translate to:
                  </Header>

                  <Dropdown
                    options={targetOptions}
                    onChange={targetLanguageChosen}
                    placeholder="Choose from dropdown"
                    search
                    inverted
                  />
                </p>
                <p>
                <Header as="h4" inverted color="grey">
                Description:
                </Header>
                <Input fluid onChange={handleFileNameChange}/>
                </p>
                <p>
                <Header as="h4" inverted color="grey">
                Select file:
                </Header>
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
                    compact
                    disabled={!fileStatus}
                    onClick={() => {updateSubmitStatus('Submitted'); toggleFileUploadProgressModal(true); console.log("payload"); onSubmit()}}
                    className="InputFileButton"
                  >
                    <Icon name="upload" />
                    {submitStatus}
                  </Button>{" "}
                  <Button
                    compact
                    onClick={toggleUploadStatus}
                    className="InputFileButton"
                  >
                    <Icon name="undo alternate" />
                    Go back
                  </Button>
                </p>
                <Modal open= {fileUploadProgressModal} >
                <Segment>
                <p className="MenuBar">
                <Header as="h3">
                Uploading audio file
              </Header>
              </p>
              <p className="MenuBar">
              <Progress  indicating percent = {fileUploadProgress}/>
            </p>
                </Segment>
                </Modal>
              </div>
            ) : (

              <div>
                <div className="TableView">
                  <p className="MenuBar">
                    <Header as="h2" inverted color="grey" floated="left">
                      T2 - Transcribe & Translate
                    </Header>
                    <Button
                      circular
                      floated="right"
                      compact
                      onClick={() =>
                        updateKeyphraseSearchStatus(!showKeyphraseSearchStatus)
                      }
                      className="InputFileButton"
                    >
                      <Icon name="search" />
                      Search by keyphrase
                    </Button>
                    ' '
                  </p>
                  <Table
                    celled
                    class="ui inverted black table"
                    className="Table"
                  >
                    <Table.Header>
                      <Table.Row textAlign="center">
                      <Table.HeaderCell>File Name</Table.HeaderCell>
                        <Table.HeaderCell>Description</Table.HeaderCell>
                        <Table.HeaderCell>Source Language</Table.HeaderCell>
                        <Table.HeaderCell>Target Language</Table.HeaderCell>
                        <Table.HeaderCell>Status</Table.HeaderCell>
                        <Table.HeaderCell>Transcription</Table.HeaderCell>
                        <Table.HeaderCell>Translation</Table.HeaderCell>
                        <Table.HeaderCell>More</Table.HeaderCell>
                      </Table.Row>
                    </Table.Header>

                    <Table.Body>{showTable()}</Table.Body>
                  </Table>

                  <Menu floated="left" pagination>
                    <Menu.Item as="a" icon>
                      Page(s)
                    </Menu.Item>
                    {showPanigation()}
                  </Menu>

                  <p className="MenuBar">
                    <Button
                      onClick={onSignOut}
                      className="InputFileButton"
                      compact
                      floated="right"
                    >
                      <Icon name="sign-out" />
                      Sign Out
                    </Button>{" "}
                    <Button
                      className="InputFileButton"
                      onClick={toggleUploadStatus}
                      compact
                      floated="right"
                    >
                      <Icon name="cloud upload" />
                      Upload File
                    </Button>{" "}
                    <Button
                      className="InputFileButton"
                      onClick={refreshPage}
                      compact
                      floated="right"
                    >
                      <Icon name="refresh" />
                      Refresh Table
                    </Button>{" "}
                  </p>


                  


                  <div>
                    <Modal open={showEditor}>
                      <Segment>
                        <p className="MenuBar">
                          <Header as="h3">
                            Translation Editor
                            <Button
                              onClick={() => {
                                portalStatus(false);
                                updateTranslationData("Loading...");
                              }}
                              floated={"right"}
                              circular
                              compact
                            >
                              <Icon name="close" />
                            </Button>
                          </Header>
                        </p>

                        <Form>
                          <TextArea
                            value={translationData}
                            onChange={handleTranslationChange}
                          />
                          <p className="MenuBar">
                            <Button
                              onClick={handleTranslationUpload}
                              compact
                              circular
                            >
                              Upload translation
                            </Button>
                          </p>
                        </Form>
                      </Segment>
                    </Modal>
                  </div>
                  <div>
                    <Modal open={showKeyphraseSearchStatus}>
                      <Segment>
                        <p className="MenuBar">
                          <Header as="h3">
                            Keyword Search
                            <Button
                              onClick={() => updateKeyphraseSearchStatus(false)}
                              floated={"right"}
                              circular
                              compact
                            >
                              <Icon name="close" />
                            </Button>
                          </Header>
                          Note: Please enter keyphrases without apostrophes (')
                        </p>

                        <Form>
                          <p className="MenuBar">
                            <Dropdown
                              options={targetOptions}
                              onChange={searchTargetLanguageChosen}
                              placeholder="Select language"
                              search
                            />
                            <p></p>

                            <TextArea
                              rows={1}
                              placeholder="Enter keyphrase"
                              onChange={handleKeyphraseChange}
                            />
                            <p></p>

                            <Button onClick={searchKeyphrases} compact circular>
                              <Icon name="search" />
                              Search
                            </Button>
                          </p>
                        </Form>
                      </Segment>
                    </Modal>
                  </div>
                  <div>
                  
                  <Modal open={showExtraInfo.toggle}>
                  <Segment>
                  <p className="MenuBar">
                    <Header as="h3">
                      Details
                      <Button
                        onClick={() =>     toggleShowExtraInfo(() => {
                          return {toggle:false, file_name:'', keyphrases:[] };
                        })}
                        floated={"right"}
                        circular
                        compact
                      >
                        <Icon name="close" />
                      </Button>
                    </Header>
                  </p>
                </Segment>

                <Segment>
                <Header as='h5'> File Name: </Header>
                 {showExtraInfo.file_name}
                </Segment>
                <Segment>
                <Header as='h5'> Keyphrases: </Header>
                
                {showExtraInfo.keyphrases.map((keyphrase) => (
                  <Label>{keyphrase}</Label>
                  ))
              }
                
                
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
