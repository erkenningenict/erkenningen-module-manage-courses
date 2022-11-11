import React, { useState } from 'react';

import { FormikProps } from 'formik';
import * as yup from 'yup';

import { Panel } from '@erkenningen/ui/layout/panel';
import { FormSelect } from '@erkenningen/ui/components/form';
import { Spinner } from '@erkenningen/ui/components/spinner';
import { toDutchDate } from '@erkenningen/ui/utils';
import { useGrowlContext } from '@erkenningen/ui/components/growl';

import FormSelectGql from 'components/FormSelectGql';
import Form from 'components/Form';
import CourseEdit from './CourseEdit';
import {
  useSearchOrganizersQuery,
  SpecialtiesDocument,
  SpecialtiesQuery,
  SpecialtiesResultFragment,
} from 'generated/graphql';
import { addYears } from 'date-fns';

const CourseNew: React.FC = () => {
  const { showGrowl } = useGrowlContext();
  const { loading: organizersLoading, data: organizers } = useSearchOrganizersQuery({
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
  const [maximumDatum, setMaximumDatum] = useState<Date | undefined>(undefined);
  let specialties: SpecialtiesResultFragment[] = [];

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
              {organizers.SearchOrganizers && organizers.SearchOrganizers.length > 1 && (
                <FormSelect
                  formControlClassName="col-sm-12"
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
              {(formikProps.values.VakgroepID || organizers.SearchOrganizers?.length === 1) && (
                <FormSelectGql
                  formControlClassName="col-sm-12"
                  labelClassNames="col-sm-12 text-left"
                  placeholder={'Selecteer een kennisaanbod'}
                  name={'VakID'}
                  label={'Kies het kennisaanbod waarop u de nieuwe bijeenkomst wilt baseren:'}
                  filter={true}
                  gqlQuery={SpecialtiesDocument}
                  onData={(data: any) => {
                    if (data) {
                      specialties = data?.Specialties as SpecialtiesResultFragment[];
                    }
                  }}
                  mapResult={(data: SpecialtiesQuery) => {
                    return (
                      data.Specialties?.map((item: SpecialtiesResultFragment) => ({
                        label: `${item.VakID} | geldig tot: ${toDutchDate(
                          new Date(item.MaximumDatum),
                        )} | ${item.Titel} | ${item.Competenties![0]?.Code} | ${
                          item.Themas![0]?.Code
                        }${item.DigitaalAanbod ? ' | Digitaal aanbod' : ''}`,
                        value: item.VakID,
                      })) ?? []
                    );
                  }}
                  variables={{
                    vakgroepId:
                      +formikProps.values.VakgroepID ||
                      +(
                        (organizers.SearchOrganizers?.length &&
                          organizers.SearchOrganizers[0].Value) ||
                        0
                      ),
                  }}
                  onChange={(e) => {
                    const specialty = specialties?.find((s) => s.VakID === +e.value);
                    setMaximumDatum(new Date(specialty?.MaximumDatum) || new Date());
                    setSpecialtyId(specialty?.VakID);
                  }}
                  value={specialtyId}
                />
              )}
            </Panel>
          </>
        )}
      </Form>
      {specialtyId && (
        <CourseEdit
          specialtyId={specialtyId}
          maximumDatum={maximumDatum || addYears(new Date(), 1)}
        ></CourseEdit>
      )}
    </>
  );
};

export default CourseNew;
