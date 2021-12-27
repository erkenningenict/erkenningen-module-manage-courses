import React, { useEffect, useState } from 'react';

import { Link, useNavigate, useLocation } from 'react-router-dom';
import * as qs from 'query-string';
import * as yup from 'yup';
import { Column } from 'primereact/column';
import { Tooltip } from 'primereact/tooltip';

import { Alert } from '@erkenningen/ui/components/alert';
import { Button } from '@erkenningen/ui/components/button';
import {
  Cursus,
  CursusStatusEnum,
  CursusDeelnameStatusEnum,
  SortDirectionEnum,
  useBijeenkomstenListLazyQuery,
  useDeleteBijeenkomstMutation,
} from 'generated/graphql';
import { DataTable } from '@erkenningen/ui/components/datatable';
import { Panel, PanelBody } from '@erkenningen/ui/layout/panel';
import { toDutchDate } from '@erkenningen/ui/utils';
import { useGrowlContext } from '@erkenningen/ui/components/growl';
import { useConfirm } from '@erkenningen/ui/components/confirm';

import { FormikProps } from 'formik';
import Form from 'components/Form';
import {
  FormCalendar,
  FormCheckbox,
  FormItem,
  FormSelect,
  FormText,
} from '@erkenningen/ui/components/form';

import styles from './List.module.css';
import { DataTablePFSEvent, DataTableSortOrderType } from 'primereact/datatable';
import { useQueryString } from '../../shared/useRouteAsState';
import { formValues } from './Search';

type IPagination = {
  pageNumber: number;
  pageSize: number;
  first: number;
};

type ISort = {
  field: string;
  direction: DataTableSortOrderType;
};

type IFilter = {
  cursusCode?: string;
  titel?: string;
  van?: string;
  tot?: string;
  status?: CursusStatusEnum | 'Alle';
  zonderDeelnames?: boolean;
  aanbiederId?: string;
  vakId?: string;
};

type IPaginationAndSort = IPagination & ISort & IFilter;

const QUERY_PARAMS_KEY = 'erkenningen-module-manage-courses-list-query-params';

const List: React.FC = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [params, updateParams] = useQueryString();
  const { showGrowl } = useGrowlContext();
  const confirm = useConfirm();

  const parseQueryParams = (): IPaginationAndSort => {
    const parsed = qs.parse(search, { parseNumbers: true });
    console.log('#DH# parsed', parsed);

    // Check if a previous stored query exists
    // if (!Object.keys(parsed).length) {
    //   const queryData = sessionStorage.getItem(QUERY_PARAMS_KEY);
    //   if (queryData) {
    //     const queryDataParsed = JSON.parse(queryData);
    //     setQueryParam(queryDataParsed);
    //     return queryDataParsed;
    //   }
    // }

    let pageNumber = 0;
    if (Number.isInteger(parsed.pageNumber)) {
      pageNumber = parsed.pageNumber as number;
    }
    let pageSize = 10;
    if (Number.isInteger(parsed.pageSize)) {
      pageSize = parsed.pageSize as number;
    }
    let field = 'Sessies:Datum';
    if (parsed.field) {
      field = parsed.field as string;
    }
    let direction: DataTableSortOrderType = -1;
    if (parsed.direction) {
      direction = parsed.direction as DataTableSortOrderType;
    }

    let cursusCode = '';
    if (parsed.cursusCode) {
      cursusCode = parsed.cursusCode as string;
    }

    let titel = '';
    if (parsed.titel) {
      titel = parsed.titel as string;
    }

    let status = undefined;
    if (parsed.status) {
      status = parsed.status as CursusStatusEnum;
    }

    let van = undefined;
    if (parsed.van) {
      van = parsed.van as string;
    }

    let tot = undefined;
    if (parsed.tot) {
      tot = parsed.tot as string;
    }

    let zonderDeelnames = false;
    if (parsed.zonderDeelnames) {
      zonderDeelnames = parsed.zonderDeelnames === 'ja';
    }

    let aanbiederId = '0';
    if (parsed.aanbiederId) {
      aanbiederId = parsed.aanbiederId as string;
    }
    let vakId = '0';
    if (parsed.vakId) {
      vakId = parsed.vakId as string;
    }
    const result = {
      first: pageNumber * pageSize,
      pageNumber,
      pageSize,
      field,
      direction,
      cursusCode,
      titel,
      status,
      van,
      tot,
      zonderDeelnames,
      aanbiederId,
      vakId,
    };

    // sessionStorage.setItem(QUERY_PARAMS_KEY, JSON.stringify(result));

    return result;
  };

  const [pagination, setPagination] = useState<IPaginationAndSort>({
    ...parseQueryParams(),
  });

  useEffect(() => {
    // const parsed = qs.parse(search, { parseNumbers: true });
    const pag = {
      ...pagination,
      cursusCode: params.cursusCode as string,
      titel: params.titel as string,
      status: params.status as CursusStatusEnum | 'Alle',
      van: params.van as string,
      tot: params.tot as string,
      zonderDeelnames: (params.zonderDeelnames as string) === 'ja' ? true : false,
      aanbiederId: params.aanbiederId as string,
      vakId: params.vakId as string,
    };
    setStateAndQueryParam(pag);
  }, [
    params.cursusCode,
    params.titel,
    pagination.status,
    pagination.van,
    pagination.tot,
    pagination.zonderDeelnames,
    pagination.aanbiederId,
    pagination.vakId,
  ]);

  useEffect(() => {
    setStateAndQueryParam(parseQueryParams());
  }, [search]);

  useEffect(() => {
    setStateAndQueryParam(parseQueryParams());
  }, [search]);

  const setStateAndQueryParam = (pagination: IPaginationAndSort) => {
    updateParams({
      pageNumber: pagination.pageNumber.toString(),
      pageSize: pagination.pageSize.toString(),
      field: pagination.field,
      direction: pagination.direction ? pagination.direction.toString() : '1',
      cursusCode: pagination.cursusCode ? pagination.cursusCode : '',
      titel: pagination.titel || '',
      status: pagination.status || '',
      van: pagination.van || '',
      tot: pagination.tot || '',
      zonderDeelnames: pagination.zonderDeelnames === true ? 'ja' : 'nee',
      aanbiederId: pagination.aanbiederId || '0',
      vakId: pagination.vakId || '0',
    });
    setPagination({ ...pagination });
  };

  useEffect(() => {
    let isCancelled = false;
    if (isCancelled) {
      return;
    }
    bijeenkomstenList();

    return () => {
      isCancelled = true;
    };
  }, [
    pagination.pageNumber,
    pagination.pageSize,
    pagination.direction,
    pagination.field,
    pagination.cursusCode,
    pagination.titel,
    pagination.status,
    pagination.van,
    pagination.tot,
    pagination.zonderDeelnames,
    pagination.aanbiederId,
    pagination.vakId,
  ]);

  const [bijeenkomstenList, { loading, data, error, refetch }] = useBijeenkomstenListLazyQuery({
    fetchPolicy: 'cache-and-network',
    variables: {
      input: {
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize || 10,
        orderBy: {
          field: pagination.field,
          sortDirection:
            pagination.direction === 1 ? SortDirectionEnum.Asc : SortDirectionEnum.Desc,
        },
        code: pagination.cursusCode,
        title: pagination.titel,
        from: pagination.van ? new Date(pagination.van).toISOString() : undefined,
        to: pagination.tot ? new Date(pagination.tot).toISOString() : undefined,
        status:
          pagination.status === 'Alle' || (pagination.status as string) === ''
            ? undefined
            : pagination.status,
        withoutParticipants: pagination.zonderDeelnames,
        vakgroepId: pagination.aanbiederId ? +pagination.aanbiederId : undefined,
        vakId: pagination.vakId ? +pagination.vakId : undefined,
      },
    },
    onError() {
      showGrowl({
        severity: 'error',
        summary: 'Bijeenkomsten ophalen',
        sticky: true,
        detail: `Er is een fout opgetreden bij het ophalen van de kennisbijeenkomst. Controleer uw invoer of neem contact met ons op.`,
      });
    },
  });

  const [deleteBijeenkomst] = useDeleteBijeenkomstMutation({
    onCompleted() {
      showGrowl({
        severity: 'success',
        summary: 'Kennisbijeenkomst verwijderd',
        detail: 'De kennisbijeenkomst is succesvol verwijderd.',
      });
      if (refetch) {
        refetch();
      }
    },
    onError(e) {
      showGrowl({
        severity: 'error',
        summary: 'Kennisbijeenkomst niet verwijderd',
        sticky: true,
        detail: `Er is een fout opgetreden bij het verwijderen van de kennisbijeenkomst: ${e.message}`,
      });
    },
  });

  // useEffect(() => {
  //   bijeenkomstenList();
  // }, [
  //   pagination.pageNumber,
  //   pagination.pageSize,
  //   pagination.direction,
  //   pagination.field,
  //   pagination.cursusCode,
  // ]);

  // const setStateAndQueryParam = (updatePagination: IPaginationAndSort) => {
  //   setQueryParam(updatePagination);
  //   setPagination({ ...updatePagination });
  // };

  const deleteCourse = (row: any) => {
    confirm({
      variant: 'danger',
      title: 'Kennisbijeenkomst verwijderen',
      description: `Weet u zeker dat u kennisbijeenkomst '${row.Titel}' wilt verwijderen?`,
      onOk: () => deleteBijeenkomst({ variables: { input: { CursusID: row.CursusID } } }),
    });
  };

  if (error) {
    console.log('error', error);
    return (
      <PanelBody>
        <Alert type="danger">Er is een fout opgetreden, probeer het later opnieuw.</Alert>
      </PanelBody>
    );
  }

  return (
    <div>
      {/* <div className="form-horizontal">
          <Form
            schema={{
              courseCode: [pagination.code, yup.string().max(255)],
              title: [pagination.title, yup.string().max(255)],
              from: [pagination.from ? new Date(pagination.from) : null, yup.date().nullable()],
              to: [pagination.to ? new Date(pagination.to) : null, yup.date().nullable()],
              status: [pagination.status ? pagination.status : null, yup.string().nullable()],
              withoutParticipants: [!!pagination.withoutParticipants, yup.boolean()],
            }}
            onSubmit={(values: any) => {
              setStateAndQueryParam({
                ...pagination,
                pageNumber: 0,
                first: 0,
                code: values.code.trim(),
                title: values.title.trim(),
                from: values.from?.getTime(),
                to: values.to?.getTime(),
                status: values.status,
                withoutParticipants: values.withoutParticipants,
              });
            }}
          >
            {(formikProps: FormikProps<any>) => (
              <>
                <div className="row">
                  <div className="col-sm-6">
                    <FormText
                      name={'courseCode'}
                      label={'Cursuscode'}
                      labelClassNames={'col-sm-4'}
                      formControlClassName="col-sm-8"
                    />
                    <FormText
                      name={'title'}
                      label={'Titel'}
                      labelClassNames={'col-sm-4'}
                      formControlClassName="col-sm-8"
                    />
                    <FormSelect
                      name={'status'}
                      label={'Status'}
                      labelClassNames={'col-sm-4'}
                      formControlClassName="col-sm-8"
                      options={[
                        {
                          label: 'Alles',
                          value: null,
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
                    />
                  </div>
                  <div className="col-sm-6">
                    <FormCalendar
                      name={'from'}
                      label={'Datum van'}
                      showButtonBar={true}
                      labelClassNames={'col-sm-5'}
                      formControlClassName="col-sm-7"
                    />
                    <FormCalendar
                      name={'to'}
                      label={'Datum tot/met'}
                      showButtonBar={true}
                      labelClassNames={'col-sm-5'}
                      formControlClassName="col-sm-7"
                    />
                    <FormCheckbox
                      name={'withoutParticipants'}
                      labelClassNames={'col-sm-5'}
                      formControlClassName="col-sm-7"
                      label={'Zonder kandidaten'}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-6">
                    <FormItem
                      label={''}
                      labelClassNames={'col-sm-4'}
                      formControlClassName={'col-sm-8 col-sm-offset-4'}
                    >
                      <Button label={'Zoeken'} icon={'pi pi-search'} type="submit" />
                    </FormItem>
                  </div>
                </div>
              </>
            )}
          </Form>
         </div> */}
      <DataTable
        value={data?.BijeenkomstenList?.nodes}
        lazy={true}
        dataKey="CursusCode"
        emptyMessage="Geen kennisbijeenkomsten gevonden. Controleer filter criteria."
        autoLayout={true}
        loading={loading}
        paginator={true}
        rows={pagination.pageSize || 10}
        rowsPerPageOptions={[10, 25, 50, 100]}
        first={pagination.first}
        onPage={(e: DataTablePFSEvent) => {
          setStateAndQueryParam({
            ...pagination,
            pageNumber: e.page || 0,
            pageSize: e.rows,
            first: e.first,
          });
        }}
        sortField={pagination.field}
        sortOrder={pagination.direction}
        onSort={(e: {
          sortField: string;
          sortOrder: DataTableSortOrderType;
          multiSortMeta: any;
        }) => {
          setStateAndQueryParam({ ...pagination, field: e.sortField, direction: e.sortOrder });
        }}
        totalRecords={data?.BijeenkomstenList?.totalCount}
        currentPageReportTemplate="{first} tot {last} van {totalRecords}"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      >
        <Column
          style={{ minWidth: '92px' }}
          body={(row: any) => (
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <Button
                label={''}
                icon="fas fa-users"
                onClick={() => navigate(`/deelnemers/${row.CursusID}`)}
                style={{ fontSize: '1rem' }}
                buttonType={'success'}
                tooltip={'Deelnemers aanmelden'}
                tooltipOptions={{ position: 'top' }}
              />
              <Button
                label={''}
                icon="fas fa-info"
                onClick={() => navigate(`/details/${row.CursusID}`)}
                style={{ fontSize: '1rem' }}
                buttonType={'info'}
                tooltip={'Kennisbijeenkomst details'}
                tooltipOptions={{ position: 'top' }}
              />
              <Button
                label={''}
                icon="fas fa-edit"
                onClick={() => navigate(`/wijzig/${row.CursusID}`)}
                style={{ fontSize: '1rem' }}
                tooltip={'Kennisbijeenkomst planning wijzigen'}
                tooltipOptions={{ position: 'top' }}
              />

              <Button
                label={''}
                icon="fas fa-trash"
                onClick={() => deleteCourse(row)}
                style={{ fontSize: '1rem' }}
                disabled={row.AantalCursusDeelnames >= 1}
                buttonType={'danger'}
                tooltip={
                  'Kennisbijeenkomst planning verwijderen (alleen mogelijk indien er geen deelnemers zijn'
                }
                tooltipOptions={{ position: 'top' }}
              />
            </div>
          )}
        />
        <Column
          field="CursusCode"
          header={'Cursuscode'}
          sortable={true}
          style={{ minWidth: '120px' }}
        />
        <Column
          field="Status"
          header={''}
          body={(row: Cursus) => (
            <>
              <Tooltip target=".tt-icon" position={'top'} />
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                {row.Status === CursusStatusEnum.Voorlopig ? (
                  <i className="fa fa-question-circle tt-icon" data-pr-tooltip="Voorlopig"></i>
                ) : null}
                {row.Status === CursusStatusEnum.Betaald ? (
                  <i
                    className="fa fa-coins tt-icon"
                    data-pr-tooltip="Betaald"
                    style={{ color: '#ffb000' }}
                  ></i>
                ) : null}
                {row.Status === CursusStatusEnum.Goedgekeurd ? (
                  <i
                    className="fa fa-check-circle tt-icon"
                    data-pr-tooltip="Goedgekeurd"
                    style={{ color: 'green' }}
                  ></i>
                ) : null}
              </div>
            </>
          )}
          style={{ minWidth: '30px' }}
        />
        <Column
          field="IsBesloten"
          header={''}
          body={(row: Cursus) => (
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {row.IsBesloten ? (
                <i
                  className="fa fa-lock tt-icon"
                  data-pr-tooltip="Besloten kennisbijeenkomst"
                  style={{ color: '#444444' }}
                ></i>
              ) : null}
            </div>
          )}
          style={{ minWidth: '30px' }}
        />
        <Column field="Titel" header={'Titel'} sortable={true} />
        <Column
          field="Datum"
          header={'Datum'}
          sortable={true}
          sortField={'Sessies:Datum'}
          body={(row: any) => toDutchDate(row.Sessies[0]?.Datum)}
          style={{ minWidth: '92px' }}
        />
        <Column
          field="Lokatie"
          header={'Locatie'}
          sortField={'Sessies:Lokatie:Naam'}
          sortable={true}
          body={(row: any) =>
            `${row.Sessies[0]?.Lokatie?.Naam} ${
              row.Sessies[0]?.Lokatie?.Naam === 'Webinar' ? '' : '|'
            } ${row.Sessies[0]?.Lokatie?.Contactgegevens?.Woonplaats || ''}`
          }
          style={{ minWidth: '180px' }}
        />
        <Column
          field="AantalCursusDeelnames"
          sortField={'AantalCursusDeelnames'}
          sortable={true}
          headerStyle={{ width: '6rem' }}
          bodyClassName={styles.center}
          header={
            <>
              <Tooltip target=".numParticipants" position={'top'} />
              <i className={'fas fa-users numParticipants'} data-pr-tooltip="Aantal deelnemers" />
            </>
          }
        />
      </DataTable>
    </div>
  );
};

export default List;
