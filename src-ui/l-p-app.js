/* Copyright 2017 Krzysztof Daniel

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/
/*jshint esversion: 6 */
/* globals document */
import React from 'react';
import ReactDOM from 'react-dom';

import {
  BrowserRouter as Router,
  Route,
  Switch,
  Link,
  Redirect
} from 'react-router-dom';

import SplashPage from './passport/l-p/SplashPage';
import LoginPage from './passport/l-p/LoginPage';
import WorkspaceListPage from './workspace/WorkspaceListPage';
import MapListPage from './map-list/MapListPage';
import MapEditorPage from './map-editor/MapEditorPage';
import FixitPage from './fixit/FixitPage';
import {
  workspaceListStore,
  getWorkspaceStore,
  getFixitStore,
  getSingleMapStore,
  cleanUpStores
} from './store-management';

import AuthStore from './passport/auth-store';
var auth = new AuthStore();

const AuthRedirect = <Redirect to={{pathname: '/' }}/>;


class MainApp extends React.Component {
  constructor(props){
    super(props);
    this.render = this.render.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.componentWillUnmount = this.componentWillUnmount.bind(this);
    this._onChange = this._onChange.bind(this);
    this.state = {
      loggedIn: props.auth.loggedIn()
    };
  }

  componentDidMount(){
    this.props.auth.addChangeListener(this._onChange);
  }

  componentWillUnmount(){
    this.props.auth.removeChangeListener(this._onChange);
  }

  _onChange() {
    //got logged out. Whatever we had cached, remove it.
    if(!this.props.auth.loggedIn()){
      cleanUpStores();
    }

    this.setState({
      loggedIn: this.props.auth.loggedIn()
    });
  }

  render(){
    let loggedIn = this.state.loggedIn;
    return (
      <Router>
      <Switch>
        <Route exact path="/"
            component={
              (props) =>
                (loggedIn ? <WorkspaceListPage
                                auth={auth}
                                history={props.history}
                                workspaceListStore={workspaceListStore}/>
                : <SplashPage auth={auth}/>)
            }/>
        <Route exact path="/login"
              component={
                (props) =>
                  (loggedIn ? AuthRedirect
                    : <LoginPage auth={auth}/>)
            }/>
            <Route path="/(workspace|fixit)/:workspaceID" render={(props) => {
                  if(!loggedIn) {

                    // for whatever reason, we are not logged in, so it is our duty to clean data in stores before doing anything else
                    cleanUpStores();

              		  auth.next(props.location, props.history);
                    return AuthRedirect;
                  }
                  const workspaceID = props.match.params.workspaceID;
                  const singleWorkspaceStore = getWorkspaceStore(workspaceID);
                  const fixitStore = getFixitStore(workspaceID);

                  return (
                      <Switch>
                        <Route exact path="/workspace/:workspaceID">
                            <MapListPage
                              auth={auth}
                              history={props.history}
                              singleWorkspaceStore={singleWorkspaceStore} />
                        </Route>
                        <Route path="/fixit/:workspaceID/variant/:variantId" render={
                          (props) => {
                            return <FixitPage
                                auth={auth}
                                history={props.history}
                                singleWorkspaceStore={singleWorkspaceStore}
                                fixitStore={fixitStore}
                                variantId={props.match.params.variantId}/>;
                          }
                        }/>
                      </Switch>
                  );
                }
              }>
            </Route>
            <Route exact path="/map/:mapID"
                render={
                (props) => {
   		         if (!loggedIn) {

                   // for whatever reason, we are not logged in, so it is our duty to clean data in stores before doing anything else
                   cleanUpStores();

      		        auth.next(props.location, props.history);
       		     }
      		      return (loggedIn ? <MapEditorPage
                                  auth={auth}
                                  history={props.history}
                                  singleMapStore={getSingleMapStore(props.match.params.mapID)}/>
                  	: AuthRedirect);
          }}/>
        <Redirect from="*" to="/" />
      </Switch>
    </Router>
    );
  }
}

ReactDOM.render( <MainApp auth={auth}/>, document.getElementById('app-container'));
