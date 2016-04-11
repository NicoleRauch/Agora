import React from 'react';
import DataTable from './DataTable.js';
import { reduce } from 'lodash';

export default (props) => {
  var columns = [
    {dataField: 'registered', title: 'Registriert'},
    {dataField: 'resourceName', title: 'Ressource'},
    {dataField: 'nickname', title: 'Nickname'},
    {dataField: 'firstname', title: 'Vorname'},
    {dataField: 'lastname', title: 'Nachname'},
    {dataField: 'email', title: 'E-Mail'},
    {dataField: 'location', title: 'Ort/Region'},
    {dataField: 'tShirtSize', title: 'T-Shirt'},
    {dataField: 'desiredRoommate', title: 'Zimmer mit'},
    {dataField: 'bankTransferDate', title: 'Überwiesen'},
    {dataField: 'creditCardDate', title: 'Kreditkarte'},
    {dataField: 'paymentReceived', title: 'Zahlungseingang'}
  ];

  const resourceNames = Object.keys(props.participants);
  const participants = reduce(resourceNames,
    (acc, resourceName) =>
      acc.concat(props.participants[resourceName].participants
        .map(participant => Object.assign({ resourceName: resourceName }, participant))),
    []
  );

  return (
    <div>
      <h4>Alle Teilnehmer mit Zahlungen</h4>
      <DataTable data={participants} columns={columns}/>
    </div>
  );
};
