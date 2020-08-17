import React from 'react';

import { useMutation } from '@apollo/client';
import { gql } from 'apollo-boost';
import { Dialog } from 'primereact/dialog';
import { FormikProps, FormikHelpers } from 'formik';
import * as yup from 'yup';

import { Alert } from '@erkenningen/ui/components/alert';
import { Button } from '@erkenningen/ui/components/button';
import { Form, FormText } from '@erkenningen/ui/components/form';
import { useGrowlContext } from '@erkenningen/ui/components/growl';

import FormSelectGql from 'components/FormSelectGql';
import { SEARCH_LOCATIONS } from 'shared/Queries';

const AddLocation: React.FC<{
  onHide: (LokatieID?: number) => void;
  visible: boolean;
  vakgroepId?: number;
}> = (props) => {
  const { showGrowl } = useGrowlContext();
  const [addLocation] = useMutation<any>(
    gql`
      mutation saveLocation($input: saveLocationInput!) {
        saveLocation(input: $input) {
          LokatieID
          Naam
        }
      }
    `,
    {
      onCompleted(data: any) {
        showGrowl({
          severity: 'success',
          summary: 'Locatie aangemaakt',
          detail: 'Locatie is succesvol aangemaakt',
        });
        props.onHide(data.saveLocation.LokatieID);
      },
      onError(e) {
        showGrowl({
          severity: 'error',
          summary: 'Locatie niet aangemaakt',
          detail:
            'Er is een fout opgetreden bij het aanmaken van de locatie. Controleer uw invoer of neem contact op met Bureau Erkenningen',
        });
      },
      update(cache, result) {
        const location = result?.data?.saveLocation;
        if (!location) {
          return;
        }
        const locations: any = cache.readQuery({
          query: SEARCH_LOCATIONS,
          variables: { VakgroepID: props.vakgroepId },
        });

        cache.writeQuery({
          query: SEARCH_LOCATIONS,
          variables: { VakgroepID: props.vakgroepId },
          data: {
            SearchLocations: [
              { Text: location.Naam, Value: location.LokatieID, __typename: 'Lokatie' },
              ...locations.SearchLocations,
            ],
          },
        });
      },
    },
  );

  const dialogFooter = (formikProps: FormikProps<any>) => {
    return (
      <div>
        <Button
          label={'Annuleren'}
          buttonType="button"
          type="secondary"
          onClick={() => props.onHide}
        />
        <Button label={'Opslaan'} buttonType="submit" loading={formikProps.isSubmitting} />
      </div>
    );
  };

  const onSubmitLocation = async (values: any, actions: FormikHelpers<any>) => {
    await addLocation({
      variables: {
        input: { ...values, VakgroepID: props.vakgroepId },
      },
    });

    actions.setSubmitting(false);
  };

  if (!props.vakgroepId && props.visible) {
    return <Alert>Selecteer eerst een kennisaanbod</Alert>;
  }

  return (
    <Form
      initialValues={{
        Naam: '',
        Routebeschrijving: '',
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
          Routebeschrijving: '',
        },
      }}
      validationSchema={yup.object({
        Naam: yup.string().max(255).required(),
        Contactgegevens: yup.object({
          Adresregel1: yup.string().max(255).required(),
          Huisnummer: yup.string().max(10).required(),
          HuisnummerToevoeging: yup.string().max(10),
          Postcode: yup.string().max(10).required(),
          Woonplaats: yup.string().max(255).required(),
          Land: yup.string().required(),
          Email: yup.string().email().required(),
          Routebeschrijving: yup.string().max(500),
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
            name={'Contactgegevens.Huisnummer'}
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
