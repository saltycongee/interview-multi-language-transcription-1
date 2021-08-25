import React from 'react';
import {Grid} from "semantic-ui-react";
import Navbar from "../../Components/Navbar/Navbar";
import logo from "../../logo.svg";

function PageContainer(props) {
    return(<Grid className="App" style={{width: "100vw", height: "100vh"}}>
        <Navbar />
        <Grid.Row>
            <Grid.Column>
                <Grid className="App-header">
                    <Grid.Row style={{paddingBottom: "0px"}}>
                        <Grid.Column textAlign={"center"} verticalAlign={"middle"}>
                            <img src={logo} className="App-logo" alt="logo" />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row style={{paddingTop: "0px"}}>
                        <Grid.Column textAlign={"center"} verticalAlign={"middle"}>
                            <p>
                                Edit <code>src/App.js</code> and save to reload.
                            </p>
                            <a
                                className="App-link"
                                href="https://reactjs.org"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Learn React
                            </a>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Grid.Column>
        </Grid.Row>
    </Grid>)
}

export default PageContainer;