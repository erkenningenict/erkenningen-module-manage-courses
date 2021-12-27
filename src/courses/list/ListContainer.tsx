import React, { useState } from 'react';
import { Panel, PanelBody } from '@erkenningen/ui/layout/panel';
import List from './List';
import Search, { formValues } from './Search';
import { Button } from '@erkenningen/ui/components/button';
import { useNavigate } from 'react-router-dom';

const ListContainer: React.FC<unknown> = () => {
  // const [search, setSearch] = useState<formValues>(defaultSearch);
  const navigate = useNavigate();
  return (
    <Panel title="Kennisbijeenkomsten beheren" doNotIncludeBody={true}>
      <PanelBody>
        <Search></Search>
      </PanelBody>
      <List></List>

      <PanelBody>
        <Button
          label={'Nieuwe kennisbijeenkomst plannen'}
          icon="pi pi-plus"
          onClick={() => navigate(`/nieuw`)}
        />
      </PanelBody>
    </Panel>
  );
};

export default ListContainer;
