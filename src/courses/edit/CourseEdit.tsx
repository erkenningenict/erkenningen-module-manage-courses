import React, { useState } from 'react';

import { useLazyQuery, useMutation } from '@apollo/react-hooks';
import { FormikProps, FormikHelpers } from 'formik';
import * as yup from 'yup';

import {
  Panel,
  FormText,
  FormCalendar,
  FormCheckbox,
  FormCurrency,
  FormItem,
  Button,
  toDutchDate,
  Alert,
} from '@erkenningen/ui';

import AddLocation from 'location/AddLocation';
import FormSelectGql from 'components/FormSelectGql';
import {
  SEARCH_LOCATIONS,
  LIST_ORGANIZERS,
  LIST_SPECIALTIES,
  GET_SPECIALTY,
  CREATE_COURSE,
} from 'shared/Queries';

import Form, { FormikSchema } from 'components/Form';

interface ICourse {
  VakgroepID: number | null;
  VakID: number | null;
  LokatieID: number | null;
  Titel: string;
  Promotietekst: string;
  Prijs: number;
  IsBesloten: boolean;
  MaximumCursisten: number;
  Opmerkingen: string;
  Datum: Date | null;
  Begintijd: Date | null;
  Eindtijd: Date | null;
  Docent: string;
  Vak?: any;
}

const CourseEdit: React.FC<{}> = (props) => {
  const [showAddLocationDialog, setShowAddLocationDialog] = useState<boolean>(false);
  const [currentForm, setCurrentForm] = useState<FormikProps<any>>();
  const [getSpecialty, { data: specialtyData }] = useLazyQuery(GET_SPECIALTY);
  const [createCourse, createCourseStatus] = useMutation(CREATE_COURSE);
  const [finished, setFinished] = useState<boolean>(false);

  const schema: FormikSchema<ICourse> = {
    VakgroepID: [null, yup.number().required()],
    VakID: [null, yup.number().required()],
    LokatieID: [null, yup.number().required()],
    Titel: ['', yup.string().max(255).required()],
    Promotietekst: ['', yup.string().max(5000).required()],
    Prijs: [0, yup.number().required()],
    IsBesloten: [false, yup.boolean().required()],
    MaximumCursisten: [1, yup.number().required()],
    Opmerkingen: ['', yup.string().max(1000).required()],
    Datum: [null, yup.date().required()],
    Begintijd: [
      null,
      yup
        .string()
        .matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g, 'Tijd moet in uu:mm formaat, bijv. 15:30')
        .required(),
    ],
    Eindtijd: [
      null,
      yup
        .string()
        .matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g, 'Tijd moet in uu:mm formaat, bijv. 15:30')
        .required(),
    ],
    Docent: ['', yup.string()],
  };

  const onNewLocationClick = (formikProps: FormikProps<any>) => {
    setCurrentForm(formikProps);
    setShowAddLocationDialog(true);
  };

  const handleAddLocation = (LokatieID?: number) => {
    if (currentForm && LokatieID) {
      currentForm.setFieldValue('LokatieID', LokatieID);
    }
    setShowAddLocationDialog(false);
  };

  return (
    <>
      <Form
        schema={schema}
        onSubmit={async (values, actions: FormikHelpers<ICourse>) => {
          const result = await createCourse({
            variables: {
              input: {
                VakID: parseInt(values.VakID),
                Titel: values.Titel,
                Promotietekst: values.Promotietekst,
                Prijs: parseFloat(values.Prijs),
                MaximumCursisten: parseInt(values.MaximumCursisten),
                IsBesloten: values.IsBesloten,
                Opmerkingen: values.Opmerkingen,
                Datum: values.Datum,
                Begintijd: new Date('01-01-2000 ' + values.Begintijd),
                Eindtijd: new Date('01-01-2000 ' + values.Eindtijd),
                LokatieID: parseInt(values.LokatieID),
                Docent: values.Docent,
              },
            },
          });

          actions.setSubmitting(false);

          if (result.data?.createCourse?.CursusID) {
            setFinished(true);
            actions.resetForm();
            actions.setFieldValue('VakgroepID', values.VakgroepID);
          }
        }}
      >
        {(formikProps: FormikProps<any>) => (
          <>
            <Panel title="Nieuwe bijeenkomst maken">
              <FormSelectGql
                labelClassNames="col-sm-12 text-left"
                placeholder={'Selecteer een kennisaanbieder'}
                name={'VakgroepID'}
                label={'Kies de kennisaanbieder waarvoor u een nieuwe cursus wilt maken'}
                filter={true}
                gqlQuery={LIST_ORGANIZERS}
              />
              {formikProps.values.VakgroepID && (
                <FormSelectGql
                  labelClassNames="col-sm-12 text-left"
                  placeholder={'Selecteer een kennisaanbod'}
                  helpText={
                    specialtyData
                      ? `Geldig van ${toDutchDate(
                          new Date(specialtyData.Specialty.MinimumDatum),
                        )} tot ${toDutchDate(new Date(specialtyData.Specialty.MaximumDatum))}`
                      : ''
                  }
                  name={'VakID'}
                  label={'Kies het kennisaanbod waarop u de nieuwe bijeenkomst wilt baseren:'}
                  filter={true}
                  gqlQuery={LIST_SPECIALTIES}
                  onChange={(e) => {
                    setFinished(false);
                    getSpecialty({ variables: { vakId: parseInt(e.value) } });
                  }}
                  mapResult={(data: any) =>
                    data.Specialties.map((item: any) => ({
                      label: `${item.VakID} | geldig tot: ${toDutchDate(
                        new Date(item.MaximumDatum),
                      )} | ${item.Titel} | ${item.Competenties[0]?.Code} | ${item.Themas[0]?.Code}${
                        item.DigitaalAanbod ? ' | Digitaal aanbod' : ''
                      }`,
                      value: item.VakID,
                    }))
                  }
                  variables={{ vakgroepId: parseInt(formikProps.values.VakgroepID) }}
                />
              )}
            </Panel>
            {finished && <Alert type="success">De bijeenkomst is succesvol aangemaakt.</Alert>}
            {createCourseStatus.error && (
              <Alert type="danger">
                Fout opgetreden bij het opslaan van de bijeenkomst. Controleer uw invoer en probeer
                het nogmaals.
              </Alert>
            )}

            {formikProps.values.VakID && (
              <Panel title="Bijeenkomst" className="form-horizontal">
                <FormText name={'Titel'} label={'Titel'} />
                <FormText name={'Promotietekst'} label={'Promotietekst'} isTextArea={true} />
                <FormCurrency
                  name={'Prijs'}
                  label={'Prijs per deelnemer'}
                  formControlClassName="col-sm-2"
                  placeholder={'0,00'}
                />
                <FormText
                  name={'MaximumCursisten'}
                  label={'Max. aantal deelnemers'}
                  formControlClassName="col-sm-2"
                  placeholder={'1'}
                />
                <FormCheckbox name={'IsBesloten'} label={'Besloten'} />
                <FormText name={'Opmerkingen'} label={'Opmerkingen'} isTextArea={true} />
                <FormCalendar name={'Datum'} label={'Datum'} formControlClassName="col-sm-3" />
                <FormText
                  name={'Begintijd'}
                  label={'Begintijd'}
                  placeholder="uu:mm"
                  formControlClassName="col-sm-3"
                  keyfilter="(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]"
                />
                <FormText
                  name={'Eindtijd'}
                  label={'Eindtijd'}
                  placeholder="uu:mm"
                  formControlClassName="col-sm-3"
                  keyfilter="(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]"
                />
                <FormSelectGql
                  name={'LokatieID'}
                  label={'Locatie'}
                  placeholder={'Selecteer een locatie'}
                  formControlClassName="col-sm-5"
                  filter={true}
                  gqlQuery={SEARCH_LOCATIONS}
                  variables={{ VakgroepID: parseInt(formikProps.values.VakgroepID, 10) }}
                >
                  <Button
                    className="mr-2"
                    label="Nieuwe locatie aanmaken"
                    type="link"
                    onClick={() => onNewLocationClick(formikProps)}
                  />
                </FormSelectGql>
                <FormText
                  name={'Docent'}
                  label={'Docent(en)'}
                  placeholder={'Voer optioneel docenten in'}
                />
                <FormItem label={' '}>
                  <Button label={'Opslaan'} buttonType="submit" />
                </FormItem>
              </Panel>
            )}
          </>
        )}
      </Form>
      <AddLocation
        onHide={handleAddLocation}
        visible={showAddLocationDialog}
        vakgroepId={currentForm?.values.VakgroepID}
      />
    </>
  );
};

export default CourseEdit;
