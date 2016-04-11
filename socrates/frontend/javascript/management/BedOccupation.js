import React from 'react';
import DataTable from './DataTable.js';

export default (props) => {

  return (
    <h4>Aufenthaltsdauer</h4>
    <DataTable data={this.props.durations} columns={[
  {dataField: 'duration', title: 'Option'},
  {dataField: 'count', title: 'Count'},
  {dataField: 'total', title: 'Total'}
  ]}/>
  );
};

/*

 .tab-pane#overview
 h4 Bettenbelegung
 .panel
 -var totalParticipants = 0
 -var totalFreeSpots = 0
 -var totalWaitingMembers = 0
 table.table.table-condensed.table-hover.table-striped.unsortedtable
 thead
 tr
 th Option
 th Teilnehmer
 th Freie Plätze
 th Wartende
 tbody
 for roomType in roomOptionIds
 -var participants = registrationReadModel.participantCountFor(roomType)
 -var quota = socratesReadModel.quotaFor(roomType)
 -var waitingMembers = registrationReadModel.waitinglistParticipantCountFor(roomType)
 -var freeSpots = quota ? quota - participants : undefined
 -totalParticipants += participants
 -totalFreeSpots = freeSpots ? totalFreeSpots + freeSpots : totalFreeSpots
 -totalWaitingMembers += waitingMembers
 tr
 td #{roomType}
 td #{participants} von #{quota || 'unbegrenzt'}
 td #{freeSpots}
 td #{waitingMembers}
 tr
 td <b>Summe</b>
 td <b>#{totalParticipants}</b>
 td <b>#{totalFreeSpots}</b>
 td <b>#{totalWaitingMembers}</b>

 */
