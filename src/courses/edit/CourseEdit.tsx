import React, { useState, useContext } from 'react';

import { Button } from '@erkenningen/ui/components/button';
import { FormikProps, FormikHelpers } from 'formik';
import { addBusinessDays, addYears, startOfDay, subDays } from 'date-fns';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';

import {
  FormText,
  FormCalendar,
  FormCheckbox,
  FormCurrency,
  FormItem,
  FormStaticItem,
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
  useBijeenkomstDetailsQuery,
  useSaveBijeenkomstMutation,
} from 'generated/graphql';
import { Alert } from '@erkenningen/ui/components/alert';
import { getTimeDisplay } from '../../shared/utils';

const CourseEdit: React.FC<{ specialtyId?: number }> = () => {
  const [showAddLocationDialog, setShowAddLocationDialog] = useState<boolean>(false);
  const [currentForm, setCurrentForm] = useState<FormikProps<any>>();
  const { clearGrowl, showGrowl } = useGrowlContext();

  const { cursusId } = useParams<'cursusId'>();
  const courseId = parseInt(cursusId || '0', 10);
  const user = useContext(UserContext);
  const navigate = useNavigate();

  const { loading: bijeenkomstLoading, data: bijeenkomst } = useBijeenkomstDetailsQuery({
    variables: { input: { cursusId: courseId } },
    fetchPolicy: 'network-only',
    onError(e) {
      console.log('#DH# e', e);
      showGrowl({
        severity: 'error',
        summary: 'Bijeenkomst gegevens ophalen',
        sticky: true,
        detail: `Er is een fout opgetreden bij het ophalen van bijeenkomst. Controleer uw invoer of neem contact op met Bureau Erkenningen`,
      });
    },
  });

  const [saveBijeenkomst] = useSaveBijeenkomstMutation({
    onCompleted() {
      showGrowl({
        severity: 'success',
        summary: 'Bijeenkomst aangemaakt',
        detail: 'De bijeenkomst is succesvol aangemaakt.',
      });
      navigate('/overzicht');
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

  if (bijeenkomstLoading) {
    return <Spinner text={'Gegevens laden...'} />;
  }

  if (!bijeenkomst?.BijeenkomstDetails?.Cursus) {
    return null;
  }
  const cursus = bijeenkomst?.BijeenkomstDetails?.Cursus;
  const sessie = cursus.Sessies ? cursus.Sessies[0] : null;
  console.log('#DH# cursus', cursus);

  if (!sessie) {
    return (
      <Panel title="Examen wijzigen" className="form-horizontal">
        <Alert type="danger">Sessie bij cursus ontbreekt</Alert>
      </Panel>
    );
  }

  const timeFilter = /(0[0-9]|1[0-9]|2[0-3])\.[0-5][0-9]/;

  return (
    <>
      <Form
        schema={{
          LokatieID: [sessie.Lokatie?.LokatieID, yup.number().required()],
          Titel: [cursus?.Titel, yup.string().max(255).required()],
          Promotietekst: [cursus?.Promotietekst, yup.string().max(5000).required()],
          Prijs: [cursus?.Prijs, yup.number().required()],
          IsBesloten: [cursus?.IsBesloten, yup.boolean().required()],
          MaximumCursisten: [cursus?.MaximumCursisten, yup.number().required()],
          Opmerkingen: [cursus?.Opmerkingen, yup.string().max(1000)],
          Datum: [sessie.Datum ? new Date(sessie.Datum) : null, yup.date().required()],
          Begintijd: [
            sessie.Begintijd ? getTimeDisplay(sessie.Begintijd) : '',
            yup
              .string()
              .matches(
                /^(0[0-9]|1[0-9]|2[0-3])(\.|:)[0-5][0-9]$/g,
                'Tijd moet in uu.mm formaat, bijv. 15.30',
              )
              .required(),
          ],
          Eindtijd: [
            sessie.Eindtijd ? getTimeDisplay(sessie.Eindtijd) : '',
            yup
              .string()
              .matches(
                /^(0[0-9]|1[0-9]|2[0-3])(\.|:)[0-5][0-9]$/g,
                'Tijd moet in uu.mm formaat, bijv. 15.30',
              )
              .required()
              .test('greaterThan', 'Eindtijd moet na begintijd liggen', function (v) {
                return !v || this.resolve(yup.ref('Begintijd') as any) < v;
              }),
          ],
          Docent: [sessie.Docent, yup.string()],
        }}
        onSubmit={async (values) => {
          clearGrowl();

          console.log('#DH# formValues', values);
          await saveBijeenkomst({
            variables: {
              input: {
                CursusID: cursus.CursusID,
                SessieID: sessie.SessieID,
                VakID: cursus.VakID || 0,
                Titel: values.Titel,
                Promotietekst: values.Promotietekst,
                IsBesloten: values.IsBesloten,
                Prijs: parseFloat(values.Prijs),
                MaximumCursisten: parseInt(values.MaximumCursisten),
                Opmerkingen: values.Opmerkingen,
                Datum: startOfDay(values.Datum),
                Begintijd: new Date('01-01-2000 ' + values.Begintijd.replace('.', ':')),
                Eindtijd: new Date('01-01-2000 ' + values.Eindtijd.replace('.', ':')),
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
                Kennisaanbod met titel: {cursus.Vak.Titel}. <br></br>Geldig van{' '}
                {toDutchDate(cursus.Vak.MinimumDatum)} t/m {toDutchDate(cursus.Vak.MaximumDatum)}
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
                placeholder="uu.mm"
                formControlClassName="col-sm-3"
                keyfilter={timeFilter}
              />
              <FormText
                name={'Eindtijd'}
                label={'Eindtijd *'}
                placeholder="uu.mm"
                formControlClassName="col-sm-3"
                keyfilter={timeFilter}
              />

              {formikProps.values.LokatieID === 10 ? (
                <FormStaticItem label={'Uitvoeringstype'}>Online cursus</FormStaticItem>
              ) : (
                <div className="form-group">
                  <label className="control-label col-sm-4 col-md-3 ">Uitvoeringstype</label>
                  <div className="col-sm-8 col-md-9 ">
                    <SelectButton
                      value={
                        formikProps.values.LokatieID === 20 ? formikProps.values.LokatieID : null
                      }
                      options={[
                        { label: 'Webinar', value: 20 },
                        { label: 'Fysieke locatie', value: null },
                      ]}
                      className={'p-button-light'}
                      onChange={(e: any) => formikProps.setFieldValue('LokatieID', e.value)}
                    />
                  </div>
                </div>
              )}

              {formikProps.values.LokatieID !== 20 ? (
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
                  variables={{ VakgroepID: cursus.Vak?.VakgroepID }}
                >
                  <Button
                    className="mr-2"
                    label="Nieuwe locatie aanmaken"
                    buttonType="link"
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
                <Button label={'Opslaan'} type="submit" icon="pi pi-check" />
                <Button
                  label={'Annuleren'}
                  buttonType="light"
                  type="button"
                  onClick={() => navigate('/overzicht')}
                />
              </FormItem>
            </Panel>
          </>
        )}
      </Form>
      <AddLocation
        onHide={handleAddLocation}
        visible={showAddLocationDialog}
        vakgroepId={cursus.Vak.VakgroepID}
      />
    </>
  );
};

export default CourseEdit;
