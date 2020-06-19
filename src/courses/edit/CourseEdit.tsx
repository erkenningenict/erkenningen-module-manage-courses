import React, { useState } from 'react';

import { FormikProps } from 'formik';

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

import AddLocation from 'location/AddLocation';
import FormSelectGql from 'components/FormSelectGql';
import { gql } from 'apollo-boost';

const CourseEdit: React.FC<{}> = (props) => {
  const [showAddLocationDialog, setShowAddLocationDialog] = useState<boolean>(false);
  const [currentForm, setCurrentForm] = useState<FormikProps<any>>();

  const onNewLocationClick = (formikProps: FormikProps<any>) => {
    setCurrentForm(formikProps);
    setShowAddLocationDialog(true);
  };

  const handleAddLocation = (LokatieID?: number) => {
    if (currentForm) {
      currentForm.setFieldValue('LokatieID', LokatieID);
    }
    setShowAddLocationDialog(false);
  };
  return (
    <>
      <Form
        initialValues={{
          titel: '',
          promotieTekst: '',
          prijsPerDeelnemer: 0,
          maxAantalDeelnemers: 1,
          besloten: false,
          opmerkingen: '',
          datum: null,
          beginTijd: null,
          eindTijd: null,
          LokatieID: null,
          docent: '',
          organizer: null,
          specialty: null,
        }}
        onSubmit={(values, actions) => {
          setTimeout(() => {
            alert(JSON.stringify(values, null, 2));
            actions.setSubmitting(false);
          }, 1000);
        }}
      >
        {(formikProps: FormikProps<any>) => (
          <>
            <Panel title="Nieuwe bijeenkomst maken">
              <FormSelect
                labelClassNames="col-sm-12 text-left"
                placeholder={'Selecteer een kennisaanbieder'}
                name={'organizer'}
                label={'Kies de kennisaanbieder waarvoor u een nieuwe cursus wilt maken'}
                options={[
                  { label: 'A', value: 1 },
                  { label: 'B', value: 2 },
                  { label: 'C', value: 3 },
                ]}
                filter={true}
              />
              <FormSelect
                labelClassNames="col-sm-12 text-left"
                placeholder={'Selecteer een kennisaanbod'}
                helpText={'Geldig van 25-05-2020 tot 23-09-2022 TODO!'}
                name={'specialty'}
                label={'Kies het kennisaanbod waarop u de nieuwe bijeenkomst wilt baseren:'}
                options={[
                  { label: 'A', value: 1 },
                  { label: 'B', value: 210007 },
                  { label: 'C', value: 3 },
                ]}
                filter={true}
              />
            </Panel>
            <Panel title="Bijeenkomst" className="form-horizontal">
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
              <FormCheckbox name={'besloten'} label={'Besloten'} />
              <FormText name={'opmerkingen'} label={'Opmerkingen'} isTextArea={true} />
              <FormCalendar name={'datum'} label={'Datum'} formControlClassName="col-sm-3" />
              <FormCalendar
                name={'beginTijd'}
                label={'Begintijd'}
                formControlClassName="col-sm-3"
              />
              <FormCalendar name={'eindTijd'} label={'Eindtijd'} formControlClassName="col-sm-3" />
              <FormSelectGql
                name={'LokatieID'}
                label={'Locatie'}
                placeholder={'Selecteer een locatie'}
                formControlClassName="col-sm-5"
                filter={true}
                gqlQuery={gql`
                  {
                    SearchLocations(input: { VakgroepID: ${formikProps.values.specialty} }) {
                      Text: Naam
                      Value: LokatieID
                    }
                  }
                `}
              >
                <Button
                  className="mr-2"
                  label="Nieuwe locatie aanmaken"
                  type="link"
                  onClick={() => onNewLocationClick(formikProps)}
                />
              </FormSelectGql>
              <FormText
                name={'docent'}
                label={'Docent(en)'}
                placeholder={'Voer optioneel docenten in'}
              />
              <FormItem label={' '}>
                <Button label={'Opslaan'} buttonType="submit" />
              </FormItem>
            </Panel>
          </>
        )}
      </Form>
      <AddLocation onHide={handleAddLocation} visible={showAddLocationDialog} />
    </>
  );
};

export default CourseEdit;
