import React, { useEffect, useState } from 'react';

import { Link, useHistory, useLocation } from 'react-router-dom';
import * as qs from 'query-string';
import * as yup from 'yup';
import { Column } from 'primereact/column';
import { Tooltip } from 'primereact/tooltip';

import { Alert } from '@erkenningen/ui/components/alert';
import { Button } from '@erkenningen/ui/components/button';
import {
  Cursus,
  CursusStatusEnum,
  //  CursusDeelnameStatusEnum,
  SortDirectionEnum,
  useDeleteKnowledgeMeetingMutation,
  useListKnowledgeMeetingsLazyQuery,
} from 'generated/graphql';
import { DataTable } from '@erkenningen/ui/components/datatable';
import { Panel } from '@erkenningen/ui/layout/panel';
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

import styles from './CourseList.module.scss';

type IPagination = {
  pageNumber: number;
  pageSize: number;
  first: number;
};

type ISort = {
  field: string;
  direction: number;
};

type IFilter = {
  courseCode?: string;
  title?: string;
  from?: number;
  to?: number;
  status?: CursusStatusEnum;
  withoutParticipants?: boolean;
};

type IPaginationAndSort = IPagination & ISort & IFilter;

const QUERY_PARAMS_KEY = 'erkenningen-module-manage-courses-list-query-params';

const CourseList: React.FC<{}> = (props) => {
  const history = useHistory();
  const { search } = useLocation();
  const { showGrowl } = useGrowlContext();
  const confirm = useConfirm();

  const setQueryParam = (queryData: IPaginationAndSort) => {
    history.push({
      search: `?pageNumber=${queryData.pageNumber}&pageSize=${queryData.pageSize}&field=${
        queryData.field
      }&direction=${queryData.direction}&courseCode=${queryData.courseCode}&title=${
        queryData.title
      }&status=${queryData.status || ''}&from=${queryData.from || ''}&to=${
        queryData.to || ''
      }&withoutParticipants=${queryData.withoutParticipants}`,
    });
  };

  const parseQueryParams = (): IPaginationAndSort => {
    const parsed = qs.parse(search, { parseNumbers: true });

    // Check if a previous stored query exists
    if (!Object.keys(parsed).length) {
      const queryData = sessionStorage.getItem(QUERY_PARAMS_KEY);
      if (queryData) {
        const queryDataParsed = JSON.parse(queryData);
        setQueryParam(queryDataParsed);
        return queryDataParsed;
      }
    }

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
    let direction = -1;
    if (parsed.direction) {
      direction = parsed.direction as number;
    }

    let courseCode = '';
    if (parsed.courseCode) {
      courseCode = parsed.courseCode as string;
    }

    let title = '';
    if (parsed.title) {
      title = parsed.title as string;
    }

    let status = undefined;
    if (parsed.status) {
      status = parsed.status as CursusStatusEnum;
    }

    let from = undefined;
    if (parsed.from) {
      from = parsed.from as number;
    }

    let to = undefined;
    if (parsed.to) {
      to = parsed.to as number;
    }

    let withoutParticipants = false;
    if (parsed.withoutParticipants) {
      withoutParticipants = parsed.withoutParticipants === 'true';
    }
    const result = {
      first: pageNumber * pageSize,
      pageNumber,
      pageSize,
      field,
      direction,
      courseCode,
      title,
      status,
      from,
      to,
      withoutParticipants,
    };

    sessionStorage.setItem(QUERY_PARAMS_KEY, JSON.stringify(result));

    return result;
  };

  const [pagination, setPagination] = useState<IPaginationAndSort>(parseQueryParams());

  const [listKnowledgeMeetings, { loading, data, error, refetch }] =
    useListKnowledgeMeetingsLazyQuery({
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
          courseCode: pagination.courseCode,
          title: pagination.title,
          from: pagination.from,
          to: pagination.to,
          status: pagination.status,
          withoutParticipants: pagination.withoutParticipants,
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

  const [deleteKnowledgeMeeting] = useDeleteKnowledgeMeetingMutation({
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

  useEffect(() => {
    listKnowledgeMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageNumber, pagination.pageSize, pagination.direction, pagination.field]);

  const setStateAndQueryParam = (updatePagination: IPaginationAndSort) => {
    setQueryParam(updatePagination);
    setPagination({ ...updatePagination });
  };

  const deleteCourse = (row: any) => {
    confirm({
      variant: 'danger',
      title: 'Kennisbijeenkomst verwijderen',
      description: `Weet u zeker dat u kennisbijeenkomst '${row.Titel}' wilt verwijderen?`,
      onOk: () => deleteKnowledgeMeeting({ variables: { input: { CursusID: row.CursusID } } }),
    });
  };

  if (error) {
    console.log('error', error);
    return (
      <Alert type="danger">
        Er is een fout opgetreden, probeer het later opnieuw. Fout informatie:{' '}
        <>
          {error?.graphQLErrors.map((e, index) => (
            <div key={index}>{e.message}</div>
          ))}
        </>
      </Alert>
    );
  }

  return (
    <div>
      <Panel title="Kennisbijeenkomsten beheren">
        <div className="form-horizontal">
          <Form
            schema={{
              courseCode: [pagination.courseCode, yup.string().max(255)],
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
                courseCode: values.courseCode.trim(),
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
                      <Button label={'Zoeken'} buttonType="submit" />
                    </FormItem>
                  </div>
                </div>
              </>
            )}
          </Form>
        </div>
        <DataTable
          value={data?.ListKnowledgeMeetings?.nodes}
          lazy={true}
          dataKey="CursusCode"
          emptyMessage="Geen kennisbijeenkomsten gevonden. Controleer filter criteria."
          autoLayout={true}
          loading={loading}
          paginator={true}
          rows={pagination.pageSize || 10}
          rowsPerPageOptions={[10, 25, 50, 100]}
          first={pagination.first}
          onPage={(e: { first: number; rows: number; page: number; pageCount: number }) => {
            if (e.pageCount === 1) {
              return;
            }

            setStateAndQueryParam({
              ...pagination,
              pageNumber: e.page,
              pageSize: e.rows,
              first: e.first,
            });
          }}
          sortField={pagination.field}
          sortOrder={pagination.direction}
          onSort={(e: { sortField: string; sortOrder: number; multiSortMeta: any }) => {
            setStateAndQueryParam({ ...pagination, field: e.sortField, direction: e.sortOrder });
          }}
          totalRecords={data?.ListKnowledgeMeetings?.totalCount}
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
                  onClick={() => history.push(`/deelnemers/${row.CursusID}`)}
                  style={{ fontSize: '1rem' }}
                  type={'success'}
                  tooltip={'Deelnemers aanmelden'}
                  tooltipOptions={{ position: 'top' }}
                />
                <Button
                  label={''}
                  icon="fas fa-info"
                  onClick={() => history.push(`/details/${row.CursusID}`)}
                  style={{ fontSize: '1rem' }}
                  type={'info'}
                  tooltip={'Kennisbijeenkomst details'}
                  tooltipOptions={{ position: 'top' }}
                />
                <Button
                  label={''}
                  icon="fas fa-edit"
                  onClick={() => history.push(`/wijzig/${row.CursusID}`)}
                  style={{ fontSize: '1rem' }}
                  tooltip={'Kennisbijeenkomst planning wijzigen'}
                  tooltipOptions={{ position: 'top' }}
                />

                <Button
                  label={''}
                  icon="fas fa-trash"
                  onClick={() => deleteCourse(row)}
                  style={{ fontSize: '1rem' }}
                  type={'danger'}
                  tooltip={'Kennisbijeenkomst planning verwijderen'}
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
              `${row.Sessies[0]?.Lokatie?.Naam} | ${
                row.Sessies[0]?.Lokatie?.Contactgegevens?.Woonplaats || ''
              }`
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
      </Panel>
      <div className="mb-1">
        <Link to="/nieuw">
          <Button label={'Nieuwe kennisbijeenkomst plannen'} icon="pi pi-plus" />
        </Link>
      </div>
    </div>
  );
};

export default CourseList;
