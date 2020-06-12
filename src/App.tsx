import React from 'react';

import { Switch, Route } from 'react-router-dom';

import { Theme, ThemeContext } from '@erkenningen/ui/';
import { ERKENNINGEN_SITE_TYPE } from '@erkenningen/config';

import CourseEdit from './courses/edit/CourseEdit';

const App: React.FC<{}> = (props) => {
  return (
    <ThemeContext.Provider value={{ mode: ERKENNINGEN_SITE_TYPE }}>
      <Theme>
        <Switch>
          <Route path="/edit" component={CourseEdit} />
          <Route path="/new" component={CourseEdit} />
          <Route path="/list">List courses</Route>
          <Route path="/">
            Route not found, please set a route in the url hash (e.g. /edit or /new)
          </Route>
        </Switch>
      </Theme>
    </ThemeContext.Provider>
  );
};

export default App;
