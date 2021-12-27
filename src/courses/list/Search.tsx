import React from 'react';
import { Button } from '@erkenningen/ui/components/button';
import { HookFormItem } from '@erkenningen/ui/components/react-hook-form';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useQueryString } from '../../shared/useRouteAsState';
import { Select } from '@erkenningen/ui/components/select';
import { Datepicker } from '@erkenningen/ui/components/datepicker';
import { Checkbox } from '@erkenningen/ui/components/checkbox';
import {
  CursusStatusEnum,
  useSearchOrganizersQuery,
  useSpecialtiesQuery,
} from '../../generated/graphql';
import { useGrowlContext } from '@erkenningen/ui/components/growl';
import { toDutchDate } from '@erkenningen/ui/utils';

export interface formValues {
  cursusCode: string;
  titel: string;
  status: CursusStatusEnum | 'alle';
  van: string;
  tot: string;
  zonderDeelnames: boolean;
  aanbiederId?: string;
  vakId?: string;
}

export const defaultSearch = (): formValues => {
  return {
    cursusCode: '',
    titel: '',
    status: 'alle',
    van: '',
    tot: '',
    zonderDeelnames: false,
    aanbiederId: '0',
    vakId: '0',
  };
};

const Search: React.FC = () => {
  const { showGrowl } = useGrowlContext();
  const [params, updateParams] = useQueryString();
  console.log('#DH# params', params);
  const formMethods = useForm({
    defaultValues: {
      cursusCode: params.cursusCode || '',
      titel: params.title || '',
      status: params.status || 'Alle',
      van: params.van || '',
      tot: params.tot || '',
      zonderDeelnames: params.zonderDeelnames === 'ja' ? true : false,
      aanbiederId: params.aanbiederId?.toString() || '0',
      vakId: params.vakId?.toString() || '0',
    },
  });

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

  const { loading: vakkenLoading, data: vakken } = useSpecialtiesQuery({
    variables: {
      vakgroepId: +params.aanbiederId,
    },
    skip: params.aanbiederId === '0',
    onError() {
      showGrowl({
        severity: 'error',
        summary: 'Kennisaanbieders ophalen',
        life: 5000,
        detail: `Er is een fout opgetreden bij het ophalen van de kennisaanbieders. Controleer uw invoer of neem contact op met Bureau Erkenningen`,
      });
    },
  });

  if (organizersLoading || vakkenLoading) {
    return null;
  }

  const onSubmit = (data: formValues) => {
    console.log('#DH# data', data);
    updateParams({
      ...params,
      cursusCode: data.cursusCode,
      titel: data.titel,
      status: data.status as string,
      van: data.van as string,
      tot: data.tot as string,
      zonderDeelnames: data.zonderDeelnames ? 'ja' : 'nee',
      aanbiederId: data.aanbiederId?.toString() as string,
      vakId: data.vakId?.toString() as string,
    });
  };

  const resetForm = () => {
    updateParams({
      ...params,
      pageNumber: '0',
      cursusCode: '',
      titel: '',
      status: '',
      van: '',
      tot: '',
      zonderDeelnames: '',
      aanbiederId: '0',
      vakId: '0',
    });
    // formMethods.reset(defaultSearch());
  };

  const aanbieders = organizers?.SearchOrganizers || [];
  const alleEnAanbieders = [
    {
      label: 'Alle',
      value: 0,
    },
    ...aanbieders.map((a) => ({ label: a.Text, value: a.Value })),
  ];

  const vakkenList = vakken?.Specialties || [];
  const alleVakken = [
    {
      label: 'Alle',
      value: 0,
    },
    ...vakkenList.map((a) => ({
      label: `${a.VakID} | Thema: ${a.Themas![0]?.Code} | Competentie: ${
        a.Competenties![0].Code
      } | ${a.Titel}. Tot: ${toDutchDate(a.MaximumDatum)}`,
      value: a.VakID,
    })),
  ];

  return (
    <FormProvider {...formMethods}>
      <form className="form form-horizontal" onSubmit={formMethods.handleSubmit(onSubmit)}>
        <div className="row">
          <div className="col-sm-12" style={{ marginLeft: '-5px', marginRight: '-5px' }}>
            <HookFormItem
              name={'aanbieder'}
              label={'Aanbieder'}
              labelClassNames="col-sm-2"
              formControlClassName="col-sm-10"
            >
              <Controller
                control={formMethods.control}
                name="aanbiederId"
                render={({ field: { onChange, value } }) => (
                  <Select
                    options={alleEnAanbieders}
                    value={+value}
                    filterPlaceholder="Zoek aanbieder"
                    onChange={(e) => {
                      onChange(e.value);
                      formMethods.handleSubmit(onSubmit)();
                    }}
                    filter={true}
                    className={`w-100`}
                  />
                )}
              ></Controller>
            </HookFormItem>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-12" style={{ marginLeft: '-5px', marginRight: '-5px' }}>
            <HookFormItem
              name={'vakId'}
              label={'Vak'}
              labelClassNames="col-sm-2"
              formControlClassName="col-sm-10"
            >
              <Controller
                control={formMethods.control}
                name="vakId"
                render={({ field: { onChange, value } }) => (
                  <Select
                    options={alleVakken}
                    value={+value}
                    filterPlaceholder="Zoek aanbod"
                    onChange={(e) => {
                      onChange(e.value);
                      formMethods.handleSubmit(onSubmit)();
                    }}
                    filter={true}
                    className={`w-100`}
                  />
                )}
              ></Controller>
            </HookFormItem>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-6">
            <HookFormItem
              name={'cursusCode'}
              label={'Erkenningsnr.'}
              labelClassNames="col-sm-4"
              formControlClassName="col-sm-6"
            >
              <input
                className="form-control"
                defaultValue={params.cursusCode || ''}
                placeholder="Erkenningsnummer"
                {...formMethods.register('cursusCode')}
                type="text"
              />
            </HookFormItem>

            <HookFormItem
              name={'title'}
              label={'Titel'}
              labelClassNames="col-sm-4"
              formControlClassName="col-sm-6"
            >
              <input
                className="form-control"
                defaultValue={params.titel || ''}
                placeholder="Titel"
                {...formMethods.register('titel')}
                type="text"
              />
            </HookFormItem>

            <HookFormItem
              name={'status'}
              label={'Status'}
              labelClassNames="col-sm-4"
              formControlClassName="col-sm-6"
            >
              <Controller
                control={formMethods.control}
                name="status"
                render={({ field: { onChange, value } }) => (
                  <Select
                    options={[
                      {
                        label: 'Alle',
                        value: 'Alle',
                      },
                      {
                        label: CursusStatusEnum.Goedgekeurd,
                        value: CursusStatusEnum.Goedgekeurd,
                      },
                      {
                        label: CursusStatusEnum.Betaald,
                        value: CursusStatusEnum.Betaald,
                      },
                      {
                        label: CursusStatusEnum.Voorlopig,
                        value: CursusStatusEnum.Voorlopig,
                      },
                    ]}
                    value={value}
                    onChange={(e) => {
                      if (e.value === 'alle') {
                        onChange('alle');
                      } else {
                        onChange(e.value as CursusStatusEnum);
                      }
                    }}
                    className={`w-100`}
                  />
                )}
              ></Controller>
            </HookFormItem>

            <HookFormItem
              label={' '}
              labelClassNames="col-sm-4"
              formControlClassName="col-sm-8"
              name={''}
            >
              <Button label={'Zoeken'} type="submit" icon={'pi pi-search'} />
              <Button
                className="ml-2"
                label={'Herstellen'}
                type="reset"
                buttonType="secondary"
                onClick={resetForm}
                icon={'pi pi-reset'}
              />
            </HookFormItem>
          </div>
          <div className="col-sm-6">
            <HookFormItem
              name={'van'}
              label={'Datum van'}
              labelClassNames="col-sm-4"
              formControlClassName="col-sm-6"
            >
              <Controller
                control={formMethods.control}
                name="van"
                render={({ field: { onChange, value } }) => (
                  <>
                    <Datepicker
                      id="van"
                      name="van"
                      value={new Date(value as string)}
                      placeholder="dd-mm-jjjj"
                      onChange={(e) => {
                        if (e.value === null) {
                          onChange(undefined);
                          return;
                        }
                        onChange((e.value as Date).toISOString());
                      }}
                      showIcon={true}
                      showWeek={true}
                    />
                  </>
                )}
              />
            </HookFormItem>
            <HookFormItem
              name={'tot'}
              label={'Datum tot'}
              labelClassNames="col-sm-4"
              formControlClassName="col-sm-6"
            >
              <Controller
                control={formMethods.control}
                name="tot"
                render={({ field: { onChange, value } }) => (
                  <Datepicker
                    id="tot"
                    name="tot"
                    value={new Date(value as string)}
                    placeholder="dd-mm-jjjj"
                    onChange={(e) => {
                      if (e.value === null) {
                        onChange(undefined);
                        return;
                      }
                      onChange((e.value as Date).toISOString());
                    }}
                    showIcon={true}
                    showWeek={true}
                  />
                )}
              />
            </HookFormItem>
            <HookFormItem
              name={'zonderDeelnames'}
              label={'Zonder deelnames'}
              labelClassNames="col-sm-4"
              formControlClassName="col-sm-6"
            >
              <Controller
                control={formMethods.control}
                name="zonderDeelnames"
                render={({ field: { onChange, value } }) => (
                  <Checkbox
                    id="zonderDeelnames"
                    name="zonderDeelnammes"
                    checked={value}
                    onChange={(e) => {
                      console.log('#DH# e', e);
                      onChange(e.checked);
                    }}
                  />
                )}
              />
            </HookFormItem>
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default Search;
