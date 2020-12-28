import React, { useState, useContext } from 'react';

import { Button } from '@erkenningen/ui/components/button';
import { FormikProps, FormikHelpers } from 'formik';
import { addBusinessDays, addYears, subDays } from 'date-fns';
import * as yup from 'yup';
import { useHistory } from 'react-router-dom';

import {
  FormText,
  FormCalendar,
  FormCheckbox,
  FormCurrency,
  FormItem,
} from '@erkenningen/ui/components/form';
import { SelectButton } from '@erkenningen/ui/components/select-button';
import { Spinner } from '@erkenningen/ui/components/spinner';
import { Panel } from '@erkenningen/ui/layout/panel';
import { useGrowlContext } from '@erkenningen/ui/components/growl';
import { toDutchDate } from '@erkenningen/ui/utils';

import AddLocation from 'location/AddLocation';
import FormSelectGql from 'components/FormSelectGql';
import { hasRole, Roles, UserContext } from 'shared/Auth';
import Form from 'components/Form';
import {
  SearchLocationsDocument,
  useSpecialtyQuery,
  useCreateCourseMutation,
  SearchLocationsQuery,
} from 'generated/graphql';

const CourseEdit: React.FC<{ specialtyId: number }> = (props) => {
  const [showAddLocationDialog, setShowAddLocationDialog] = useState<boolean>(false);
  const [currentForm, setCurrentForm] = useState<FormikProps<any>>();
  const { clearGrowl, showGrowl } = useGrowlContext();
  const user = useContext(UserContext);
  const history = useHistory();

  const { loading: specialtyLoading, data: specialty } = useSpecialtyQuery({
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

  const [createCourse] = useCreateCourseMutation({
    onCompleted(data) {
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
          LokatieID: [20, yup.number().required()],
          Titel: [specialty.Specialty.Titel, yup.string().max(255).required()],
          Promotietekst: [specialty.Specialty.Promotietekst, yup.string().max(5000).required()],
          Prijs: [specialty.Specialty.Kosten, yup.number().required()],
          IsBesloten: [false, yup.boolean().required()],
          MaximumCursisten: [specialty.Specialty.MaximumCursisten, yup.number().required()],
          Opmerkingen: ['', yup.string().max(1000)],
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
              .required()
              .test('greaterThan', 'Eindtijd moet na begintijd liggen', function (v) {
                return !v || this.resolve(yup.ref('Begintijd')) < v;
              }),
          ],
          Docent: ['', yup.string()],
        }}
        onSubmit={async (values, actions: FormikHelpers<any>) => {
          if (!specialty.Specialty) {
            return;
          }

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
        }}
      >
        {(formikProps: FormikProps<any>) => (
          <>
            <Panel title="Bijeenkomst" className="form-horizontal">
              <p>
                Kennisaanbod geldig van {toDutchDate(specialty.Specialty?.MinimumDatum)} t/m{' '}
                {toDutchDate(specialty.Specialty?.MaximumDatum)}
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
              <FormText name={'Opmerkingen'} label={'Opmerkingen'} isTextArea={true} />
              <FormCalendar
                name={'Datum'}
                label={'Datum *'}
                formControlClassName="col-sm-3"
                minDate={
                  hasRole(Roles.Rector, user?.Roles)
                    ? subDays(new Date(), 100)
                    : addBusinessDays(new Date(), 4)
                }
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

              <div className="form-group">
                <label className="control-label col-sm-4 col-md-3 ">Locatie type</label>
                <div className="col-sm-8 col-md-9 ">
                  <SelectButton
                    value={
                      [10, 20].includes(formikProps.values.LokatieID)
                        ? formikProps.values.LokatieID
                        : null
                    }
                    options={[
                      { label: 'Webinar', value: 20 },
                      { label: 'Online cursus', value: 10 },
                      { label: 'Fysieke locatie', value: null },
                    ]}
                    className={'p-button-light'}
                    onChange={(e) => formikProps.setFieldValue('LokatieID', e.value)}
                  />
                </div>
              </div>

              {![10, 20].includes(formikProps.values.LokatieID) ? (
                <FormSelectGql
                  name={'LokatieID'}
                  label={'Locatie *'}
                  placeholder={'Selecteer een locatie'}
                  formControlClassName="col-sm-5"
                  filter={true}
                  mapResult={(data: SearchLocationsQuery) => {
                    return (
                      data.SearchLocations?.filter(
                        (location) => ![10, 20].includes(location.LokatieID),
                      ).map((location) => ({
                        label: `${location.Naam}${
                          location.Contactgegevens?.Woonplaats
                            ? ' | ' + location.Contactgegevens?.Woonplaats
                            : ''
                        }`,
                        value: location.LokatieID,
                      })) || []
                    );
                  }}
                  gqlQuery={SearchLocationsDocument}
                  variables={{ VakgroepID: specialty.Specialty?.VakgroepID }}
                >
                  <Button
                    className="mr-2"
                    label="Nieuwe locatie aanmaken"
                    type="link"
                    onClick={() => onNewLocationClick(formikProps)}
                  />
                </FormSelectGql>
              ) : null}
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
