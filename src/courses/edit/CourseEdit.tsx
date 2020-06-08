import React from 'react';

import {
  Panel,
  Form,
  FormSelect,
  FormText,
  FormCalendar,
  FormCheckbox,
  FormItem,
  Button,
} from '@erkenningen/ui';

const CourseEdit: React.FC<{}> = (props) => {
  return (
    <>
      <Panel title="Nieuwe bijeenkomst maken">
        <FormSelect
          labelClassNames="col-sm-12"
          placeholder={'Selecteer een kennisaanbieder'}
          id={'organizer'}
          label={'Kies de kennisaanbieder waarvoor u een nieuwe cursus wilt maken'}
          options={[]}
        />
        <FormSelect
          labelClassNames="col-sm-12"
          placeholder={'Selecteer een kennisaanbod'}
          helpText={'Geldig van 25-05-2020 tot 23-09-2022 TODO!'}
          id={'specialty'}
          label={'Kies het kennisaanbod waarop u de nieuwe bijeenkomst wilt baseren:'}
          options={[]}
        />
      </Panel>
      <Panel title="Bijeenkomst">
        <Form onSubmit={() => {}} className="hello">
          <FormText id={'titel'} label={'Titel'} />
          <FormText id={'promotieTekst'} label={'Promotietekst'} isTextArea={true} />
          <FormText
            id={'prijsPerDeelnemer'}
            label={'Prijs per deelnemer'}
            formControlClassName="col-sm-2"
            placeholder={'0,00'}
          />
          <FormText
            id={'maxAantalDeelnemers'}
            label={'Max. aantal deelnemers'}
            formControlClassName="col-sm-2"
            placeholder={'1'}
          />
          <FormCheckbox id={'besloten'} label={'Besloten'} value={true} />
          <FormText id={'opmerkingen'} label={'Opmerkingen'} isTextArea={true} />
          <FormCalendar id={'datum'} label={'Datum'} formControlClassName="col-sm-3" />
          <FormCalendar id={'beginTijd'} label={'Begintijd'} formControlClassName="col-sm-3" />
          <FormCalendar id={'eindTijd'} label={'Eindtijd'} formControlClassName="col-sm-3" />
          <FormSelect
            id={'locatie'}
            label={'Locatie'}
            options={[]}
            placeholder={'Selecteer een locatie'}
            formControlClassName="col-sm-5"
          />
          <FormText id={'docent'} label={'Docent(en)'} placeholder={'Voer optioneel docenten in'} />
          <FormItem label={' '}>
            <Button label={'Opslaan'} />
          </FormItem>
        </Form>
      </Panel>
    </>
  );
};

export default CourseEdit;
