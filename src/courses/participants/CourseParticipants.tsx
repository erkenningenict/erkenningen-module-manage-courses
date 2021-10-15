import React, { useState } from 'react';

import { useGrowlContext } from '@erkenningen/ui/components/growl';
import { Spinner } from '@erkenningen/ui/components/spinner';
import { Panel } from '@erkenningen/ui/layout/panel';

import {
  DebiteurTypeEnum,
  SortDirectionEnum,
  useGetInvoicesQuery,
  useKnowledgeMeetingDetailsQuery,
  useRemoveKnowledgeMeetingParticipantMutation,
  useSubmitKnowledgeMeetingParticipantsMutation,
  useUploadKnowledgeMeetingParticipantsExcelMutation,
} from 'generated/graphql';
import { Link, useHistory, useParams } from 'react-router-dom';
import { Button } from '@erkenningen/ui/components/button';
import { FileUpload } from '@erkenningen/ui/components/file-upload';
import { Row } from '@erkenningen/ui/layout/row';
import { Col } from '@erkenningen/ui/layout/col';
import { Alert } from '@erkenningen/ui/components/alert';
import { toDutchDate } from '@erkenningen/ui/utils';
import { FormStaticItem } from '../../components/FormStaticItem';

import styles from './CourseParticipants.module.scss';
import { useConfirm } from '@erkenningen/ui/components/confirm';
import { toDutchMoney } from '@erkenningen/ui/utils';
import { isPast } from 'date-fns/esm';
import Show from '../../components/Show';

const CourseParticipants: React.FC<{}> = (props) => {
  const { showGrowl } = useGrowlContext();
  const confirm = useConfirm();
  const history = useHistory();

  const [excelProcessingResult, setExcelProcessingResult] = useState<{
    ready: boolean;
    success: boolean;
    validationErrors: string[];
  }>({
    ready: false,
    success: false,
    validationErrors: [],
  });
  const divRef = React.createRef<any>();

  const { id: courseId } = useParams<any>();

  const {
    loading: knowledgeMeetingLoading,
    data: knowledgeMeeting,
    refetch: reloadKnowledgeMeeting,
  } = useKnowledgeMeetingDetailsQuery({
    fetchPolicy: 'network-only',
    variables: { input: { CursusID: +courseId } },
    onError() {
      showGrowl({
        severity: 'error',
        summary: 'Kennisbijeenkomst ophalen',
        sticky: true,
        detail: `Er is een fout opgetreden bij het ophalen van de kennisbijeenkomst. Controleer uw invoer of neem contact met ons op.`,
      });
    },
  });

  const { loading: invoicesLoading, data: invoices } = useGetInvoicesQuery({
    fetchPolicy: 'network-only',
    variables: {
      pageNumber: 1,
      pageSize: 10,
      sortField: 'FactuurNummer',
      sortDirection: SortDirectionEnum.Asc,
      filterInvoices: {
        CursusCode: knowledgeMeeting?.KnowledgeMeetingDetails?.Cursus?.CursusCode,
        VakgroepID: knowledgeMeeting?.KnowledgeMeetingDetails?.Cursus?.Vak.VakgroepID,
        DebiteurType: DebiteurTypeEnum.Vakgroep,
        DebiteurID: knowledgeMeeting?.KnowledgeMeetingDetails?.Cursus?.Vak.VakgroepID,
      },
    },
  });

  const [uploadParticipantsExcel, { loading: uploadParticipantsExcelLoading }] =
    useUploadKnowledgeMeetingParticipantsExcelMutation({
      onCompleted(data) {
        showGrowl({
          severity: 'success',
          summary: 'Excelbestand geupload',
        });

        reloadKnowledgeMeeting();
      },
      onError(e) {
        showGrowl({
          severity: 'error',
          summary: 'Fout bij verwerken excelbestand',
          detail: e.message,
        });
      },
    });

  const [removeParticipant] = useRemoveKnowledgeMeetingParticipantMutation({
    onCompleted(data) {
      showGrowl({
        severity: 'success',
        summary: 'Deelnemer verwijderd',
      });

      reloadKnowledgeMeeting();
    },
    onError(e) {
      showGrowl({
        severity: 'error',
        summary: 'Fout bij verwijderen deelnemer',
        detail: e.message,
      });
    },
  });

  const [submitParticipants, submitParticipantsMutation] =
    useSubmitKnowledgeMeetingParticipantsMutation({
      onCompleted(data) {
        showGrowl({
          severity: 'success',
          summary: 'Deelnemers definitief aangemeld',
        });

        reloadKnowledgeMeeting();
      },
      onError(e) {
        showGrowl({
          severity: 'error',
          summary: 'Fout bij definitief aanmelden',
          detail: e.message,
        });
      },
    });

  if (knowledgeMeetingLoading) {
    return (
      <Panel title="Kennisbijeenkomst" className="form-horizontal">
        <Spinner text={'Gegevens laden...'} />
      </Panel>
    );
  }

  if (!courseId || !knowledgeMeeting?.KnowledgeMeetingDetails?.Cursus) {
    return (
      <Panel title="Kennisbijeenkomst details" className="form-horizontal">
        <Alert type="danger">Cursus niet gevonden</Alert>
      </Panel>
    );
  }

  const course = knowledgeMeeting?.KnowledgeMeetingDetails.Cursus;
  const session = course?.Sessies?.length ? course?.Sessies[0] : null;

  const uploadParticipants = async (file: File) => {
    if (
      ![
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ].includes(file.type)
    ) {
      showGrowl({
        severity: 'error',
        summary: 'Ongeldig bestandsformaat',
        sticky: true,
        detail: `Bestand kan niet verwerkt worden omdat het geen geldig Excelbestand (.xls, .xlsx) is`,
      });

      return;
    }

    const result = await uploadParticipantsExcel({
      variables: {
        input: {
          CursusID: course.CursusID,
          file,
        },
      },
    });

    if (result.errors) {
      setExcelProcessingResult({
        ready: true,
        success: false,
        validationErrors: ['Onbekende fout opgetreden'],
      });
    } else if (result.data?.uploadKnowledgeMeetingParticipantsExcel?.success) {
      setExcelProcessingResult({
        ready: true,
        success: true,
        validationErrors: [],
      });
    } else {
      setExcelProcessingResult({
        ready: true,
        success: false,
        validationErrors: result.data?.uploadKnowledgeMeetingParticipantsExcel
          ?.validationErrors || ['Onbekende fout opgetreden'],
      });
    }
  };

  const onRemoveParticipantClick = (name: string, participantId: number) => {
    confirm({
      variant: 'danger',
      title: 'Deelnemer verwijderen',
      description: `Weet u zeker dat u deelenemer '${name}' wilt verwijderen?`,
      onOk: async () =>
        await removeParticipant({
          variables: {
            input: {
              CursusID: course.CursusID,
              CursusDeelnameID: participantId,
            },
          },
        }),
    });
  };

  const onSubmitParticipantsClick = () => {
    submitParticipants({
      variables: {
        input: {
          CursusID: +courseId,
        },
      },
    });
  };

  const getInvoiceJsLink = (link: string, invoiceId: number): { __html: string } => {
    if (!link) {
      return { __html: '' };
    }
    return {
      __html: `<div id="link-${invoiceId}" onclick="${link};return false;"></div>`,
    };
  };

  const meetingDatePassed = course?.Sessies?.length
    ? isPast(new Date(course?.Sessies[0].DatumBegintijd))
    : false;

  const canAddParticipants = !meetingDatePassed && course.AantalDeelnamesAangemeld === 0;

  const canSubmit =
    !meetingDatePassed &&
    course.AantalDeelnamesAangemeld === 0 &&
    (course?.AantalDeelnamesVoorlopig || 0) > 0;

  return (
    <>
      <Panel title="Kennisbijeenkomst" className="form-horizontal">
        <Row>
          <Col size={'col-md-8'}>
            <FormStaticItem
              label="Titel"
              labelClassNames={'col-sm-4 col-md-3'}
              fieldClassNames={'col-sm-8 col-md-9'}
            >
              {course.Titel}
            </FormStaticItem>
            <FormStaticItem
              label="Datum"
              labelClassNames={'col-sm-4 col-md-3'}
              fieldClassNames={'col-sm-8 col-md-9'}
            >
              {toDutchDate(session?.Datum)}
            </FormStaticItem>
          </Col>
          <Col size={'col-md-4 col-lg-4'}>
            <FormStaticItem
              label="Vakcode"
              labelClassNames={'col-sm-4'}
              fieldClassNames={'col-sm-8'}
            >
              {course.VakID}
            </FormStaticItem>
            <FormStaticItem
              label="Cursuscode"
              labelClassNames={'col-sm-4 '}
              fieldClassNames={'col-sm-8'}
            >
              {course.CursusID}
            </FormStaticItem>
          </Col>
        </Row>
      </Panel>
      <Show if={canAddParticipants}>
        <Row>
          <Col>
            <Panel title="Aanmelden" className="form-horizontal">
              {uploadParticipantsExcelLoading ? (
                <span>
                  <Spinner text={'Bestand uploaden'} />
                </span>
              ) : (
                <FileUpload
                  accept=".xls"
                  label="Excelformulier uploaden"
                  onSelect={(e) => {
                    uploadParticipants((e.originalEvent as any).currentTarget.files[0]);
                  }}
                />
              )}
              <div className={'mt-1'}>
                {excelProcessingResult.ready ? (
                  excelProcessingResult.success ? (
                    <Alert type={'success'}>Excelbestand succesvol verwerkt</Alert>
                  ) : (
                    <>
                      <Alert type={'danger'}>
                        Er{' '}
                        {excelProcessingResult.validationErrors.length > 1
                          ? 'zijn fouten'
                          : 'is een fout'}{' '}
                        opgetreden bij het verwerken van het Excelbestand.
                        <br />
                        Los onderstaande{' '}
                        {excelProcessingResult.validationErrors.length > 1 ? 'fouten ' : 'fout '}
                        op en dien opnieuw in om verder te gaan.
                        <br />
                        <br />
                        <ul>
                          {excelProcessingResult.validationErrors.map((err, ix) => (
                            <li key={ix}>{err}</li>
                          ))}
                        </ul>
                      </Alert>
                    </>
                  )
                ) : null}
              </div>
            </Panel>
          </Col>
        </Row>
      </Show>
      <Row>
        <Col>
          <Panel title="Deelnemers" className="form-horizontal" doNotIncludeBody={true}>
            {!course.CursusDeelnames?.length ? (
              <Alert type={'info'} className={'m-1'}>
                Er zijn nog geen deelnemers gemeld.
              </Alert>
            ) : (
              <div className="table-responsive">
                <table
                  className="table table-striped table-responsive"
                  cellSpacing={0}
                  style={{ borderCollapse: 'collapse' }}
                >
                  <tbody>
                    <tr>
                      <th>Geboren</th>
                      <th>Naam</th>
                      <th>Adres</th>
                      <th>Postcode</th>
                      <th>Woonplaats</th>
                      <th>Telefoon</th>
                      <th>E-mail</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                    {course.CursusDeelnames?.map((participation, index) => (
                      <tr key={index}>
                        <td>{toDutchDate(participation.Persoon?.Geboortedatum)}</td>
                        <td>{participation.Persoon?.SortableFullName}</td>
                        <td>{participation.Persoon?.Contactgegevens.Adresregel1}</td>
                        <td>{participation.Persoon?.Contactgegevens.Postcode}</td>
                        <td>{participation.Persoon?.Contactgegevens.Telefoon}</td>
                        <td>{participation.Persoon?.Contactgegevens.Woonplaats}</td>
                        <td>
                          <a href={`mailto:${participation.Persoon?.Contactgegevens.Email}`}>
                            {participation.Persoon?.Contactgegevens.Email}
                          </a>
                        </td>
                        <td>{participation.Status}</td>
                        <td>
                          <Show if={canSubmit}>
                            <Button
                              label={''}
                              icon="fas fa-trash"
                              onClick={() =>
                                onRemoveParticipantClick(
                                  participation.Persoon?.SortableFullName || '',
                                  participation.CursusDeelnameID,
                                )
                              }
                              style={{ fontSize: '1rem' }}
                              tooltip={'Deelnemer verwijderen'}
                              tooltipOptions={{ position: 'top' }}
                            />
                          </Show>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Show if={canSubmit}>
              <div className="p-1">
                <Button
                  label={'Definitief aanmelden'}
                  icon="fas fa-users"
                  onClick={onSubmitParticipantsClick}
                  style={{ marginRight: '1rem' }}
                  loading={submitParticipantsMutation.loading}
                />
              </div>
            </Show>
          </Panel>
        </Col>
      </Row>
      <Row>
        <Col>
          <Panel title="Facturen" className="form-horizontal" doNotIncludeBody={true}>
            <div className={styles.panelInfo}>
              Na succesvolle upload wordt de deelnemerlijst verstuurd naar uw emailadres (de
              aanvrager), en naar het contactpersoon emailadres van uw kennisaanbieder. Hieronder
              kunt u de facturen van deze kennisbijeenkomst bekijken.
            </div>

            {invoicesLoading ? (
              <span>
                <Spinner />
              </span>
            ) : (
              <div className="table-responsive">
                <table
                  className="table table-striped table-responsive"
                  cellSpacing={0}
                  style={{ borderCollapse: 'collapse' }}
                >
                  <tbody>
                    <tr>
                      <th>Factuurnummer</th>
                      <th>Datum</th>
                      <th>Product</th>
                      <th>Code</th>
                      <th>Ex. BTW</th>
                      <th>BTW</th>
                      <th>Totaal</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                    {(invoices?.invoices?.nodes || []).map((invoice) => (
                      <tr key={invoice.FactuurID}>
                        <td>{invoice.KenmerkJaarFactuurNummer}</td>
                        <td>{toDutchDate(invoice.FactuurDatum)}</td>
                        <td>{invoice.ProductNaam}</td>
                        <td>{invoice.ProductCode}</td>
                        <td>{toDutchMoney(invoice.BedragExBtw)}</td>
                        <td>{toDutchMoney(invoice.BtwBedrag)}</td>
                        <td>
                          <b>{toDutchMoney(invoice.BedragIncBtw)}</b>
                        </td>
                        <td>{invoice.FactuurStatus}</td>
                        <td>
                          <Button
                            label={''}
                            icon="fas fa-file-invoice"
                            style={{ fontSize: '1rem' }}
                            tooltip={'Factuur bekijken'}
                            tooltipOptions={{ position: 'top' }}
                            onClick={() => {
                              document.getElementById('link-' + invoice.FactuurID)?.click();
                            }}
                          />
                          <div
                            ref={divRef}
                            dangerouslySetInnerHTML={getInvoiceJsLink(
                              invoice.InvoiceLink,
                              invoice.FactuurID,
                            )}
                          ></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </Col>
      </Row>

      <Button
        label={'Bewerken'}
        icon="fas fa-edit"
        onClick={() => history.push(`/wijzig/${course.CursusID}`)}
        style={{ marginRight: '1rem' }}
      />
      <Link to="/overzicht">Terug naar overzicht</Link>
    </>
  );
};

export default CourseParticipants;
