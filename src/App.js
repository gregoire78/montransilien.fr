import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Monitor from './Monitor';

class App extends Component {
  render() {
    return (
      <Router>
        <Switch>
          <Route exact path="/:uic(\d{8})" component={Monitor}/>
          <Route render={() => <h1>Page not found</h1>} />
        </Switch>
      </Router>
    );
  }
}

export default App;
