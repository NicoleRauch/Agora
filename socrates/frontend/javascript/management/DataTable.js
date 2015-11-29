import React from 'react';

export default (props) => (
  <table className="table table-condensed table-hover table-striped">
    <thead>
    <tr>
      { props.columns.map((column, index) => <th key={'thead-' + index}>{column.title}</th>) }
    </tr>
    </thead>

    <tbody>
    { props.data.map((data, rindex) =>
        <tr key={'trow-' + rindex}>
          { props.columns.map((column, cindex) =>
            <td key={'tdata-' + cindex + '-' + rindex}> { data[column.dataField] } </td> )}
        </tr>
    )}
    </tbody>
  </table>
);
