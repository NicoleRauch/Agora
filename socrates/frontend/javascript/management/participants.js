import React from 'react';
import DataTable from './DataTable.js';

export default ({participants}) => {
  const participantColumns = [
    {dataField: 'registeredAt', title: 'Registriert'},
    {dataField: 'nickname', title: 'Nickname'},
    {dataField: 'firstname', title: 'Vorname'},
    {dataField: 'lastname', title: 'Nachname'},
    {dataField: 'location', title: 'Ort / Region'},
    {dataField: 'duration', title: 'bleibt bis'},
    {dataField: '', title: 'ändern in'},
    {dataField: '', title: 'umbuchen in'},
    {dataField: '', title: 'entfernen'}
  ];

  return (
    <div>
      { participants.map(participantsPerRoom => {
          return ( <div key={'participants-' + participantsPerRoom.roomType}>
            <h4>{participantsPerRoom.roomType} ({participantsPerRoom.participants.length} von {participantsPerRoom.limit !== '0' ? participantsPerRoom.limit : 'unlimited'})</h4>
            <DataTable data={participantsPerRoom.participants} columns={participantColumns}/>
          </div> );
        })}
    </div>
  );
};
