import React from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';

export default (props) => (
  <div>
    <h1>Adressen der Teilnehmer</h1>
    <BootstrapTable data={props.participants} striped={true} hover={true} condensed={true} search={true}>
      <TableHeaderColumn dataSort={true} dataField='firstname'>Vorname</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='lastname'>Nachname</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='email' isKey={true}>E-Mail</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='homeAddress'>Heimatadresse</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='billingAddress'>Rechnungsadresse</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='resourceNames'>Ressource</TableHeaderColumn>
    </BootstrapTable>

    <hr>

    <h1>Adressen der Wartenden</h1>
    <BootstrapTable data={props.waiting} striped={true} hover={true} condensed={true} search={true}>
      <TableHeaderColumn dataSort={true} dataField='firstname'>Vorname</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='lastname'>Nachname</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='email' isKey={true}>E-Mail</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='tShirtSize'>T-Shirt</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='desiredRoommate'>Zimmer mit</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='homeAddress'>Heimatadresse</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='billingAddress'>Rechnungsadresse</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='resourceNames'>Ressource</TableHeaderColumn>
    </BootstrapTable>
  </div>
);
