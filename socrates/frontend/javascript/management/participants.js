import React from 'react';
import DataTable from './DataTable.js';

export default (props) => {
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
      { Object.keys(props.participants).map(resourceName => {
          const resource = props.participants[resourceName];
          return <div key={'participants-' + resourceName}>
            <h4>{resourceName} ({resource.participants.length} von {resource.limit || 'unbegrenzt'})</h4>
            <DataTable data={resource.participants} columns={participantColumns}/>
          </div>
        })}
    </div>
  );
}
