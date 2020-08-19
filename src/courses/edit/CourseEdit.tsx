import React, { useState } from 'react';

import { useMutation, useQuery } from '@apollo/client';
import { Button } from '@erkenningen/ui/components/button';
import { FormikProps, FormikHelpers } from 'formik';
import { addDays, addYears } from 'date-fns';
import * as yup from 'yup';

import {
  FormText,
  FormCalendar,
  FormCheckbox,
  FormCurrency,
  FormItem,
} from '@erkenningen/ui/components/form';
import { Spinner } from '@erkenningen/ui/components/spinner';
import { Panel } from '@erkenningen/ui/layout/panel';
import { useGrowlContext } from '@erkenningen/ui/components/growl';

import AddLocation from 'location/AddLocation';
import FormSelectGql from 'components/FormSelectGql';
import { SEARCH_LOCATIONS, GET_SPECIALTY, CREATE_COURSE } from 'shared/Queries';

import Form from 'components/Form';
import { useHistory } from 'react-router-dom';
import { toDutchDate } from '@erkenningen/ui/utils';

const CourseEdit: React.FC<{ specialtyId: number }> = (props) => {
  const [showAddLocationDialog, setShowAddLocationDialog] = useState<boolean>(false);
  const [currentForm, setCurrentForm] = useState<FormikProps<any>>();
  const { clearGrowl, showGrowl } = useGrowlContext();
  const history = useHistory();
  const { loading: specialtyLoading, data: specialty } = useQuery(GET_SPECIALTY, {
    variables: { vakId: props.specialtyId },
    onError() {
      showGrowl({
        severity: 'error',
        summary: 'Kennisaanbod ophalen',
        sticky: true,
        detail: `Er is een fout opgetreden bij het ophalen van het kennisaanbod. Controleer uw invoer of neem contact op met Bureau Erkenningen`,
      });
    },
  });

  const [createCourse] = useMutation(CREATE_COURSE, {
    onCompleted(data: any) {
      showGrowl({
        severity: 'success',
        summary: 'Bijeenkomst aangemaakt',
        detail: 'De bijeenkomst is succesvol aangemaakt.',
      });
      history.push('/gereed');
    },
    onError(e) {
      showGrowl({
        severity: 'error',
        summary: 'Bijeenkomst niet aangemaakt',
        sticky: true,
        detail: `Er is een fout opgetreden bij het aanmaken van de bijeenkomst: ${e.message} Controleer uw invoer of neem contact op met Bureau Erkenningen`,
      });
    },
  });

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

  if (specialtyLoading) {
    return <Spinner text={'Gegevens laden...'} />;
  }

  if (!specialty?.Specialty) {
    return null;
  }

  return (
    <>
      <Form
        schema={{
          LokatieID: [null, yup.number().required()],
          Titel: [specialty.Specialty.Titel, yup.string().max(255).required()],
          Promotietekst: [specialty.Specialty.Promotietekst, yup.string().max(5000).required()],
          Prijs: [specialty.Specialty.Kosten, yup.number().required()],
          IsBesloten: [false, yup.boolean().required()],
          MaximumCursisten: [specialty.Specialty.MaximumCursisten, yup.number().required()],
          Opmerkingen: ['', yup.string().max(1000).required()],
          Datum: [null, yup.date().required()],
          Begintijd: [
            null,
            yup
              .string()
              .matches(
                /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g,
                'Tijd moet in uu:mm formaat, bijv. 15:30',
              )
              .required(),
          ],
          Eindtijd: [
            null,
            yup
              .string()
              .matches(
                /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/g,
                'Tijd moet in uu:mm formaat, bijv. 15:30',
              )
              .required(),
          ],
          Docent: ['', yup.string()],
        }}
        onSubmit={async (values, actions: FormikHelpers<any>) => {
          clearGrowl();
          await createCourse({
            variables: {
              input: {
                VakID: +specialty.Specialty.VakID,
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
        }}
      >
        {(formikProps: FormikProps<any>) => (
          <>
            <Panel title="Bijeenkomst" className="form-horizontal">
              <p>
                Kennisaanbod geldig van {toDutchDate(specialty.Specialty.MinimumDatum)} t/m{' '}
                {toDutchDate(specialty.Specialty.MaximumDatum)}
              </p>
              <FormText name={'Titel'} label={'Titel *'} />
              <FormText name={'Promotietekst'} label={'Promotietekst *'} isTextArea={true} />
              <FormCurrency
                name={'Prijs'}
                label={'Prijs per deelnemer *'}
                formControlClassName="col-sm-2"
                placeholder={'0,00'}
              />
              <FormText
                name={'MaximumCursisten'}
                label={'Max. aantal deelnemers *'}
                formControlClassName="col-sm-2"
                placeholder={'1'}
              />
              <FormCheckbox name={'IsBesloten'} label={'Besloten'} />
              <FormText name={'Opmerkingen'} label={'Opmerkingen *'} isTextArea={true} />
              <FormCalendar
                name={'Datum'}
                label={'Datum *'}
                formControlClassName="col-sm-3"
                minDate={addDays(new Date(), 7)}
                maxDate={addYears(new Date(), 50)}
              />
              <FormText
                name={'Begintijd'}
                label={'Begintijd *'}
                placeholder="uu:mm"
                formControlClassName="col-sm-3"
                keyfilter="(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]"
              />
              <FormText
                name={'Eindtijd'}
                label={'Eindtijd *'}
                placeholder="uu:mm"
                formControlClassName="col-sm-3"
                keyfilter="(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]"
              />
              <FormSelectGql
                name={'LokatieID'}
                label={'Locatie *'}
                placeholder={'Selecteer een locatie'}
                formControlClassName="col-sm-5"
                filter={true}
                gqlQuery={SEARCH_LOCATIONS}
                variables={{ VakgroepID: specialty.Specialty.VakgroepID }}
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
                <Button label={'Opslaan'} buttonType="submit" icon="pi pi-check" />
              </FormItem>
            </Panel>
          </>
        )}
      </Form>
      <AddLocation
        onHide={handleAddLocation}
        visible={showAddLocationDialog}
        vakgroepId={specialty?.Specialty.VakgroepID}
      />
    </>
  );
};

export default CourseEdit;
