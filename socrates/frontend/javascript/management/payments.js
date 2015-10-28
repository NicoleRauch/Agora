import React from 'react';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';

export default (props) => (
  <div>
    <h1>Alle Teilnehmer mit Zahlungen</h1>
    <BootstrapTable data={props.participants} striped={true} hover={true} condensed={true} search={true}>
      <TableHeaderColumn dataSort={true} dataField='registered'>Registriert</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='resourceNames'>Ressource</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='nickname'>Nickname</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='firstname'>Vorname</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='lastname'>Nachname</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='email' isKey={true}>E-Mail</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='location'>Ort/Region</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='tShirtSize'>T-Shirt</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='desiredRoommate'>Zimmer mit</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='bankTransferDate'>Überwiesen</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='creditCardDate'>Kreditkarte</TableHeaderColumn>
      <TableHeaderColumn dataSort={true} dataField='paymentReceived'>Zahlungseingang</TableHeaderColumn>
    </BootstrapTable>

  </div>
);
