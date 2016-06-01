import React from 'react';
import DurationChange from './DurationChange';

export default ({participants}) => {

  return (
    <div>
      { participants.map(participantsPerRoom => {
        return ( <div key={'participants-' + participantsPerRoom.roomType}>
          <h4>{participantsPerRoom.roomType} ({participantsPerRoom.participants.length}&nbsp;
            of {participantsPerRoom.limit !== '0' ? participantsPerRoom.limit : 'unlimited'})</h4>

          <table className="table table-condensed table-hover table-striped">
            <thead>
            <tr>
              <th>Registered</th>
              <th>Nickname</th>
              <th>Given Name</th>
              <th>Surname</th>
              <th>Location</th>
              <th>stays until</th>
              <th>change to</th>
              <th>rebook to</th>
              <th>remove</th>
            </tr>
            </thead>

            <tbody>
            { participantsPerRoom.participants.map((data, rindex) =>
              <tr key={'trow-' + rindex}>
                <td>{data.registeredAt}</td>
                <td>{data.nickname}</td>
                <td>{data.firstname}</td>
                <td>{data.lastname}</td>
                <td>{data.location}</td>
                <td>{data.duration}</td>
                <td><DurationChange/></td>
                <td>blank</td>
                <td>blank</td>
              </tr>
            ) }
            </tbody>
          </table>
        </div> );
      })}
    </div>
  );
};
