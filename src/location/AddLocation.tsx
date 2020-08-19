import React from 'react';

import { useMutation } from '@apollo/client';
import { gql } from 'apollo-boost';
import { Dialog } from 'primereact/dialog';
import { FormikProps, FormikHelpers } from 'formik';
import * as yup from 'yup';

import { Alert } from '@erkenningen/ui/components/alert';
import { Button } from '@erkenningen/ui/components/button';
import { Form, FormText, FormItem } from '@erkenningen/ui/components/form';
import { useGrowlContext } from '@erkenningen/ui/components/growl';

import FormSelectGql from 'components/FormSelectGql';
import { SEARCH_LOCATIONS } from 'shared/Queries';
import useWindowDimensions from 'shared/useWindowDimensions';

const AddLocation: React.FC<{
  onHide: (LokatieID?: number) => void;
  visible: boolean;
  vakgroepId?: number;
}> = (props) => {
  const { showGrowl } = useGrowlContext();
  const { width, height } = useWindowDimensions();
  const dialogOverflow =
    width < 400 || height < 400 ? { overflowY: 'auto' } : { overflowY: 'visible' };
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
        console.log(e);
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
          variables: { VakgroepID: parseInt(props.vakgroepId as any, 10) },
        });

        cache.writeQuery({
          query: SEARCH_LOCATIONS,
          variables: { VakgroepID: parseInt(props.vakgroepId as any, 10) },
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

  const onSubmitLocation = async (values: any, actions: FormikHelpers<any>) => {
    await addLocation({
      variables: {
        input: { ...values, VakgroepID: parseInt(props.vakgroepId as any, 10) },
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
        IsActief: true,
        Contactgegevens: {
          Adresregel1: '',
          Huisnummer: '',
          HuisnummerToevoeging: '',
          Postcode: '',
          Woonplaats: '',
          Land: 'Nederland',
          Telefoon: '',
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
          Telefoon: yup.string().max(30),
        }),
      })}
      onSubmit={onSubmitLocation}
      className="form-horizontal"
    >
      {(formikProps: FormikProps<any>) => (
        <Dialog
          header="Locatie toevoegen"
          modal={true}
          onHide={props.onHide}
          visible={props.visible}
          style={{ width: '50vw', ...dialogOverflow }}
          maximized={width < 400}
          blockScroll={true}
        >
          <FormText name={'Naam'} label={'Naam *'} />
          <FormText name={'Contactgegevens.Adresregel1'} label={'Straat *'} />
          <FormText
            name={'Contactgegevens.Huisnummer'}
            label={'Huisnummer *'}
            formControlClassName="col-sm-4"
          />
          <FormText
            name={'Contactgegevens.HuisnummerToevoeging'}
            label={'Toev.'}
            formControlClassName="col-sm-3"
          />
          <FormText
            name={'Contactgegevens.Postcode'}
            label={'Postcode *'}
            formControlClassName="col-sm-4"
          />
          <FormText name={'Contactgegevens.Woonplaats'} label={'Woonplaats *'} />
          <FormSelectGql
            name={'Contactgegevens.Land'}
            label={'Land *'}
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
          <FormText name={'Contactgegevens.Telefoon'} label={'Telefoon'} />

          <FormItem label={' '}>
            <Button
              label={'Opslaan'}
              buttonType="submit"
              loading={formikProps.isSubmitting}
              icon="pi pi-check"
            />
          </FormItem>
        </Dialog>
      )}
    </Form>
  );
};

export default AddLocation;
