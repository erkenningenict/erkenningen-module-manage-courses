import React from 'react';

import { Switch, Route } from 'react-router-dom';
import { FormatErrorParams } from 'yup';
import * as yup from 'yup';

import { Theme, ThemeContext, GrowlProvider } from '@erkenningen/ui/';
import { ERKENNINGEN_SITE_TYPE } from '@erkenningen/config';

import CourseEdit from './courses/edit/CourseEdit';

// @TODO Move to lib?
yup.setLocale({
  mixed: {
    default: 'Ongeldig',
    required: 'Verplicht',
    notType: (params: FormatErrorParams) => {
      console.log(params);
      if (!params.value) {
        return 'Verplicht';
      }

      switch (params.type) {
        case 'number':
          return 'Moet een getal zijn';
        case 'date':
          return 'Verplicht';
        default:
          return 'Ongeldige waarde';
      }
    },
  },
  string: {
    email: 'Ongeldig e-mailadres',
    min: 'Minimaal ${min} karakters', // eslint-disable-line no-template-curly-in-string
    max: 'Maximaal ${max} karakters', // eslint-disable-line no-template-curly-in-string
  },
  number: {
    // min?: TestOptionsMessage<{ min: number }>;
    // max?: TestOptionsMessage<{ max: number }>;
    // lessThan?: TestOptionsMessage<{ less: number }>;
    // moreThan?: TestOptionsMessage<{ more: number }>;
    // positive?: TestOptionsMessage<{ more: number }>;
    // negative?: TestOptionsMessage<{ less: number }>;
    // integer?: TestOptionsMessage;
  },
});

const App: React.FC<{}> = (props) => {
  return (
    <ThemeContext.Provider value={{ mode: ERKENNINGEN_SITE_TYPE }}>
      <GrowlProvider>
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
      </GrowlProvider>
    </ThemeContext.Provider>
  );
};

export default App;
