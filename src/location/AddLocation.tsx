import React from 'react';

import { gql } from 'apollo-boost';
import { Dialog } from 'primereact/dialog';
import { FormikProps, FormikConfig, FormikHelpers } from 'formik';
import * as yup from 'yup';

import { Button, Form, FormText, useGrowlContext } from '@erkenningen/ui';

import FormSelectGql from 'components/FormSelectGql';
import { useMutation } from '@apollo/react-hooks';

// @TODO Move to lib?
yup.setLocale({
  mixed: {
    default: 'Ongeldig',
    required: 'Verplicht',
  },
  string: {
    email: 'Ongeldig e-mailadres',
    min: 'Minimaal ${min} karakters',
    max: 'Maximaal ${max} karakters',
  },
});

const AddLocation: React.FC<{ onHide: (LokatieID?: number) => void; visible: boolean }> = (
  props,
) => {
  const { showGrowl } = useGrowlContext();
  const [addLocation, { data, loading, error }] = useMutation<any>(
    gql`
      mutation saveLocation($input: saveLocationInput!) {
        saveLocationInput(input: $input)
      }
    `,
    {
      onCompleted({ data: any }) {
        console.log(data);
      },
      onError(e) {
        console.log(e);
      },
    },
  );

  const dialogFooter = (formikProps: FormikProps<any>) => {
    return (
      <div>
        <Button label={'Annuleren'} buttonType="button" type="secondary" onClick={props.onHide} />
        <Button label={'Opslaan'} buttonType="submit" loading={formikProps.isSubmitting} />
      </div>
    );
  };

  const onSubmitLocation = async (values: any, actions: FormikHelpers<any>) => {
    console.log('A');
    await addLocation(values);

    showGrowl({
      severity: 'success',
      summary: 'Locatie aangemaakt',
      detail: 'Locatie is succesvol aangemaakt' + JSON.stringify(values, null, 2),
    });
    showGrowl({
      severity: 'error',
      summary: 'Locatie niet aangemaakt',
      detail:
        'Er is een fout opgetreden bij het aanmaken van de locatie. Controleer uw invoer of neem contact op met Bureau Erkenningen',
    });
    actions.setSubmitting(false);
    // props.onHide(2);
  };

  return (
    <Form
      initialValues={{
        Naam: '',
        Contactgegevens: {
          Adresregel1: '',
          Huisnummer: '',
          HuisnummerToevoeging: '',
          Postcode: '',
          Woonplaats: '',
          Land: 'Nederland',
          Email: '',
          Telefoon: '',
          Website: '',
        },
      }}
      validationSchema={yup.object({
        Locatie: yup.object({
          Naam: yup.string().max(255).required(),
        }),
        Contactgegeven: yup.object({
          Adresregel1: yup.string().max(255).required(),
          Huisnummer: yup.string().max(10).required(),
          HuisnummerToevoeging: yup.string().max(10),
          Postcode: yup.string().max(10).required(),
          Woonplaats: yup.string().max(255).required(),
          Land: yup.string().required(),
          Email: yup.string().email().required(),
        }),
      })}
      onSubmit={onSubmitLocation}
      className="form-horizontal"
    >
      {(formikProps: FormikProps<any>) => (
        <Dialog
          header="Locatie toevoegen"
          style={{ width: '50vw' }}
          modal={true}
          onHide={props.onHide}
          footer={dialogFooter(formikProps)}
          visible={props.visible}
        >
          <FormText name={'Naam'} label={'Naam'} />
          <FormText name={'Contactgegevens.Adresregel1'} label={'Straat'} />
          <FormText
            name={'Contactgegeven.Huisnummer'}
            label={'Huisnummer'}
            formControlClassName="col-sm-4"
          />
          <FormText
            name={'Contactgegevens.HuisnummerToevoeging'}
            label={'Toev.'}
            formControlClassName="col-sm-3"
          />
          <FormText
            name={'Contactgegevens.Postcode'}
            label={'Postcode'}
            formControlClassName="col-sm-4"
          />
          <FormText name={'Contactgegevens.Woonplaats'} label={'Woonplaats'} />
          <FormSelectGql
            name={'Contactgegevens.Land'}
            label={'Land'}
            placeholder={'Selecteer een land'}
            filter={true}
            gqlQuery={gql`
              {
                Landen {
                  Text
                  Value
                }
              }
            `}
          />
          <FormText name={'Contactgegevens.Email'} label={'E-mail'} />
          <FormText name={'Contactgegevens.Telefoon'} label={'Telefoon'} />
          <FormText name={'Contactgegevens.Website'} label={'Website'} />
        </Dialog>
      )}
    </Form>
  );
};

export default AddLocation;
