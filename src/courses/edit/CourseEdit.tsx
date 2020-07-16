import React, { useState } from 'react';

import { useLazyQuery } from '@apollo/react-hooks';
import { FormikProps } from 'formik';
import * as yup from 'yup';

import {
  Panel,
  Form,
  FormText,
  FormCalendar,
  FormCheckbox,
  FormCurrency,
  FormItem,
  Button,
  toDutchDate,
} from '@erkenningen/ui';

import AddLocation from 'location/AddLocation';
import FormSelectGql from 'components/FormSelectGql';
import { SEARCH_LOCATIONS, LIST_ORGANIZERS, LIST_SPECIALTIES, GET_SPECIALTY } from 'shared/Queries';

const CourseEdit: React.FC<{}> = (props) => {
  const [showAddLocationDialog, setShowAddLocationDialog] = useState<boolean>(false);
  const [currentForm, setCurrentForm] = useState<FormikProps<any>>();
  const [getSpecialty, { data: specialtyData }] = useLazyQuery(GET_SPECIALTY);

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
        initialValues={{
          VakgroepID: null,
          VakID: null,
          Vak: null,
          LokatieID: null,
          Titel: '',
          Promotietekst: '',
          Prijs: 0,
          IsBesloten: false,
          MaximumCursisten: 1,
          Opmerkingen: '',
          Datum: null,
          Begintijd: null,
          Eindtijd: null,
          Docent: '',
        }}
        validationSchema={yup.object({
          VakgroepID: yup.number().required(),
          VakID: yup.number().required(),
          LokatieID: yup.number().required(),
          Titel: yup.string().max(255).required(),
          Promotietekst: yup.string().max(5000).required(),
          Prijs: yup.number().required(),
          IsBesloten: yup.boolean().required(),
          MaximumCursisten: yup.number().required(),
          Opmerkingen: yup.string().max(1000),
          Datum: yup.date().required(),
          Begintijd: yup.string().required(),
          Eindtijd: yup.string().required(),
          Docent: yup.string(),
        })}
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
                  mask={'99:99'}
                  formControlClassName="col-sm-3"
                />
                <FormCalendar
                  name={'Eindtijd'}
                  label={'Eindtijd'}
                  formControlClassName="col-sm-3"
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
