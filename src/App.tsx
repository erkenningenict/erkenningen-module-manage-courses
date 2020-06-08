import React from "react";
import { Switch, Route } from "react-router-dom";

const App: React.FC<{}> = (props) => {
  return (
    <Switch>
      <Route path="/edit">Edit course</Route>
      <Route path="/new">Create course</Route>
      <Route path="/list">List courses</Route>
      <Route path="/">
        Route not found, please set a route in the url hash (e.g. /edit or /new)
      </Route>
    </Switch>
  );
};

export default App;
