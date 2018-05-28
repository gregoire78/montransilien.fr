import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Monitor from './Monitor';
import MonitorSation from './MonitorSation';
import Home from './Home';

class App extends Component {
  render() {
    return (
      <Router>
        <Switch>
          <Route exact path="/" component={Home}/>
          <Route exact path="/:uic(\d{8})" component={Monitor}/>
          <Route exact path="/:tr3a(\w{2,3})" component={MonitorSation}/>
          <Route render={() => <h1>Page not found</h1>} />
        </Switch>
      </Router>
    );
  }
}

export default App;
