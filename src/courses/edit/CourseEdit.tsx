import React from 'react';

import { Formik } from 'formik';

import {
  Panel,
  Form,
  FormSelect,
  FormText,
  FormCalendar,
  FormCheckbox,
  FormItem,
  Button,
} from '@erkenningen/ui';

const CourseEdit: React.FC<{}> = (props) => {
  return (
    <>
      <Formik
        initialValues={{
          titel: '',
        }}
        onSubmit={(values, actions) => {
          setTimeout(() => {
            alert(JSON.stringify(values, null, 2));
            actions.setSubmitting(false);
          }, 3000);
        }}
      >
        {(props) => (
          <Form onSubmit={props.handleSubmit}>
            <Panel title="Nieuwe bijeenkomst maken">
              <FormSelect
                labelClassNames="col-sm-12"
                placeholder={'Selecteer een kennisaanbieder'}
                id={'organizer'}
                label={'Kies de kennisaanbieder waarvoor u een nieuwe cursus wilt maken'}
                options={[
                  { label: 'A', value: 1 },
                  { label: 'B', value: 2 },
                  { label: 'C', value: 3 },
                ]}
                value={2}
              />
              <FormSelect
                labelClassNames="col-sm-12"
                placeholder={'Selecteer een kennisaanbod'}
                helpText={'Geldig van 25-05-2020 tot 23-09-2022 TODO!'}
                id={'specialty'}
                label={'Kies het kennisaanbod waarop u de nieuwe bijeenkomst wilt baseren:'}
                options={[
                  { label: 'A', value: 1 },
                  { label: 'B', value: 2 },
                  { label: 'C', value: 3 },
                ]}
              />
            </Panel>
            <Panel title="Bijeenkomst">
              <FormText name={'titel'} label={'Titel'} />
              <FormText name={'promotieTekst'} label={'Promotietekst'} isTextArea={true} />
              <FormText
                name={'prijsPerDeelnemer'}
                label={'Prijs per deelnemer'}
                formControlClassName="col-sm-2"
                placeholder={'0,00'}
              />
              <FormText
                name={'maxAantalDeelnemers'}
                label={'Max. aantal deelnemers'}
                formControlClassName="col-sm-2"
                placeholder={'1'}
              />
              <FormCheckbox id={'besloten'} label={'Besloten'} value={true} />
              <FormText name={'opmerkingen'} label={'Opmerkingen'} isTextArea={true} />
              <FormCalendar id={'datum'} label={'Datum'} formControlClassName="col-sm-3" />
              <FormCalendar id={'beginTijd'} label={'Begintijd'} formControlClassName="col-sm-3" />
              <FormCalendar id={'eindTijd'} label={'Eindtijd'} formControlClassName="col-sm-3" />
              <FormSelect
                id={'locatie'}
                label={'Locatie'}
                options={[
                  { label: 'A', value: 1 },
                  { label: 'B', value: 2 },
                  { label: 'C', value: 3 },
                ]}
                placeholder={'Selecteer een locatie'}
                formControlClassName="col-sm-5"
              />
              <FormText
                name={'docent'}
                label={'Docent(en)'}
                placeholder={'Voer optioneel docenten in'}
              />
              <FormItem label={' '}>
                <Button label={'Opslaan'} buttonType="submit" />
              </FormItem>
            </Panel>
          </Form>
        )}
      </Formik>
    </>
  );
};

export default CourseEdit;
