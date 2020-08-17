import React from 'react';

import { Switch, Route } from 'react-router-dom';
import { FormatErrorParams } from 'yup';
import * as yup from 'yup';

import { GrowlProvider } from '@erkenningen/ui/components/growl';
import { ThemeBureauErkenningen } from '@erkenningen/ui/layout/theme';
import { ThemeContext } from '@erkenningen/ui/layout/theme';

import { ERKENNINGEN_SITE_TYPE } from '@erkenningen/config';

import CourseEdit from './courses/edit/CourseEdit';

// @TODO Move to lib?
yup.setLocale({
  mixed: {
    default: 'Ongeldig',
    required: 'Verplicht',
    notType: (params: FormatErrorParams) => {
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
});

const App: React.FC<{}> = (props) => {
  return (
    <ThemeContext.Provider value={{ mode: ERKENNINGEN_SITE_TYPE }}>
      <GrowlProvider>
        <ThemeBureauErkenningen>
          <Switch>
            <Route path="/wijzig/:id" component={CourseEdit} />
            <Route path="/nieuw" component={CourseEdit} />
            <Route path="/overzicht">List courses</Route>
            <Route path="/">
              Route not found, please set a route in the url hash (e.g. /overzicht, /wijzig/1234 or
              /nieuw)
            </Route>
          </Switch>
        </ThemeBureauErkenningen>
      </GrowlProvider>
    </ThemeContext.Provider>
  );
};

export default App;
