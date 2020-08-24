import React, { useState } from 'react';

import { FormikProps } from 'formik';
import * as yup from 'yup';

import { Panel } from '@erkenningen/ui/layout/panel';
import { FormSelect } from '@erkenningen/ui/components/form';
import { Spinner } from '@erkenningen/ui/components/spinner';
import { toDutchDate } from '@erkenningen/ui/utils';
import { useGrowlContext } from '@erkenningen/ui/components/growl';

import { LIST_ORGANIZERS, LIST_SPECIALTIES } from 'shared/Queries';
import FormSelectGql from 'components/FormSelectGql';
import Form from 'components/Form';
import CourseEdit from './CourseEdit';
import { useQuery } from '@apollo/client';

const CourseNew: React.FC<{}> = () => {
  const { showGrowl } = useGrowlContext();
  const { loading: organizersLoading, data: organizers } = useQuery(LIST_ORGANIZERS, {
    onError() {
      showGrowl({
        severity: 'error',
        summary: 'Kennisaanbieders ophalen',
        life: 5000,
        detail: `Er is een fout opgetreden bij het ophalen van de kennisaanbieders. Controleer uw invoer of neem contact op met Bureau Erkenningen`,
      });
    },
  });
  const [specialtyId, setSpecialtyId] = useState<number | undefined>(undefined);

  if (organizersLoading) {
    return <Spinner text={'Gegevens laden...'} />;
  }

  if (!organizers) {
    return null;
  }

  return (
    <>
      <Form
        schema={{
          VakgroepID: [null, yup.number().required()],
          VakID: [null, yup.number().required()],
        }}
        onSubmit={async (values: any, actions: any) => {
          actions.setSubmitting(false);
        }}
      >
        {(formikProps: FormikProps<any>) => (
          <>
            <Panel title="Nieuwe bijeenkomst maken en plannen">
              {organizers.SearchOrganizers.length > 1 && (
                <FormSelect
                  labelClassNames="col-sm-12 text-left"
                  placeholder={'Selecteer een kennisaanbieder'}
                  name={'VakgroepID'}
                  label={'Kies de kennisaanbieder waarvoor u een nieuwe cursus wilt maken'}
                  filter={true}
                  options={
                    organizers.SearchOrganizers?.map((item: any) => ({
                      label: item.Text,
                      value: item.Value,
                    })) || []
                  }
                  onChange={(e) => {
                    formikProps.setFieldValue('VakID', undefined);
                    setSpecialtyId(undefined);
                  }}
                />
              )}
              {(formikProps.values.VakgroepID || organizers.SearchOrganizers.length === 1) && (
                <FormSelectGql
                  labelClassNames="col-sm-12 text-left"
                  placeholder={'Selecteer een kennisaanbod'}
                  name={'VakID'}
                  label={'Kies het kennisaanbod waarop u de nieuwe bijeenkomst wilt baseren:'}
                  filter={true}
                  gqlQuery={LIST_SPECIALTIES}
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
                  variables={{
                    vakgroepId:
                      +formikProps.values.VakgroepID || +organizers.SearchOrganizers[0].Value,
                  }}
                  onChange={(e) => setSpecialtyId(+e.value)}
                  value={specialtyId}
                />
              )}
            </Panel>
          </>
        )}
      </Form>
      {specialtyId && <CourseEdit specialtyId={specialtyId}></CourseEdit>}
    </>
  );
};

export default CourseNew;
