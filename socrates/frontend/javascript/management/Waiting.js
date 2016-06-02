import React from 'react';
import DataTable from './DataTable.js';

export default ({waiting}) => {

  var columns = [
    {dataField: 'joinedWaitinglist', title: 'Joined'},
    {dataField: 'roomTypes', title: 'Desired Room Types'},
    {dataField: 'nickname', title: 'Nickname'},
    {dataField: 'firstname', title: 'First name'},
    {dataField: 'lastname', title: 'Last name'}
  ];

  return (
    <div>
      <h4>Wartende</h4>
      <DataTable data={waiting} columns={columns}/>
    </div>
  );
};

/*

 .tab-pane#waitinglist
 h4 Wartende (#{waitinglistLines.length})
 .panel
 table.table.table-condensed.table-hover.table-striped.membertable
 thead
 tr
 th Eingetragen
 th Nickname
 th Vorname
 th Nachname
 th Ort/Region
 th Übernehmen
 th ändern in
 th entfernen
 tbody
 for line in waitinglistLines
 tr
 td #{formatDate(registrationReadModel.joinedWaitinglistAt(line.member.id()))}
 td #{+linkedMember(line.member.nickname())}
 td #{line.member.firstname()}
 td #{line.member.lastname()}
 td #{line.member.location()}
 td: +fromWaitinglistToParticipant(roomType, member.nickname())
 td: +newWaitinglist(roomType, member.nickname())
 td: +removeWaitinglistMemberWithModal(roomType, member.nickname())
 hr


 */
