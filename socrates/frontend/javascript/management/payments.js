import React from 'react';
import DataTable from './DataTable.js';

export default (props) => {
  var columns = [
    {dataField: 'registered', title: 'Registriert'},
    {dataField: 'resourceNames', title: 'Ressource'},
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

  return (
    <div>
      <h1>Alle Teilnehmer mit Zahlungen</h1>
      <DataTable data={props.participants} columns={columns}/>
    </div>
  )
}
