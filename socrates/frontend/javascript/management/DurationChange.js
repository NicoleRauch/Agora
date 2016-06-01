import React, {Component} from 'react';

export default class extends Component {

  constructor(props) {
    super(props);
    this.input = {};
  }

  render() {
    return (
      <div>
        <select className="form-control" style={{height: 'inherit'}} ref={c => { this.input.select = c; }}>
          <option value="0">&nbsp;</option>
          <option value="2">saturday evening</option>
          <option value="3">sunday morning</option>
          <option value="4">sunday evening</option>
          <option value="5">monday morning</option>
        </select>
        <button className="btn btn-default btn-xs" onClick={()=>{}}>Change</button>
      </div>
    );
  }
}
