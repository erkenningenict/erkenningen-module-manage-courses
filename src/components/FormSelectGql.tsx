import React from 'react';

import { useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { DocumentNode } from 'graphql';

import { FormSelect } from '@erkenningen/ui';

const FormSelectGql: React.FC<
  { gqlQuery: DocumentNode } & Omit<React.ComponentProps<typeof FormSelect>, 'options'>
> = (props) => {
  const { loading, error, data } = useQuery(props.gqlQuery);

  if (error) {
    return <span>Fout opgetreden bij het ophalen van de gegevens</span>;
  }

  return (
    <>
      <FormSelect
        {...props}
        loading={loading}
        options={
          data
            ? data[Object.keys(data)[0]].map((c: any) => ({ label: c.Text, value: c.Value }))
            : []
        }
      />
    </>
  );
};

export default FormSelectGql;
