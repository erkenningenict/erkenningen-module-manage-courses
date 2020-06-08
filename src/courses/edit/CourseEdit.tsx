import React from "react";

import {
  Panel,
  Form,
  FormSelect,
  FormText,
  FormCalendar,
} from "@erkenningen/ui";

const CourseEdit: React.FC<{}> = (props) => {
  return (
    <>
      <Panel title="Nieuwe bijeenkomst maken">
        <FormSelect
          labelClassNames="col-sm-12"
          placeholder={"Selecteer een kennisaanbieder"}
          id={"organizer"}
          label={
            "Kies de kennisaanbieder waarvoor u een nieuwe cursus wilt maken"
          }
          options={[]}
        />
        <FormSelect
          labelClassNames="col-sm-12"
          placeholder={"Selecteer een kennisaanbod"}
          helpText={"Geldig van 25-05-2020 tot 23-09-2022 TODO!"}
          id={"specialty"}
          label={
            "Kies het kennisaanbod waarop u de nieuwe bijeenkomst wilt baseren:"
          }
          options={[]}
        />
      </Panel>
      <Panel title="Bijeenkomst">
        <Form onSubmit={() => {}} className="hello">
          <FormText id={"titel"} label={"Titel"} />
          <FormText
            id={"promotieTekst"}
            label={"Promotietekst"}
            isTextArea={true}
          />
          <FormText id={"prijsPerDeelnemer"} label={"Prijs per deelnemer"} />
          <FormText
            id={"maxAantalDeelnemers"}
            label={"Max. aantal deelnemers"}
          />
          <FormText id={"besloten"} label={"Besloten"} />
          <FormText
            id={"opmerkingen"}
            label={"Opmerkingen"}
            isTextArea={true}
          />
          <FormCalendar id={"datum"} label={"Datum"} />
          <FormCalendar id={"beginTijd"} label={"Begintijd"} />
          <FormCalendar id={"eindTijd"} label={"Eindtijd"} />
          <FormSelect
            id={"locatie"}
            label={"Locatie"}
            options={[]}
            placeholder={"Selecteer een locatie"}
          />
          <FormText
            id={"docent"}
            label={"Docent(en)"}
            placeholder={"Voer optioneel docenten in"}
          />
        </Form>
      </Panel>
    </>
  );
};

export default CourseEdit;
