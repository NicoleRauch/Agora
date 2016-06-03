import React, {Component} from 'react';

export default class extends Component {

  constructor(props) {
    super(props);
    this.input = {};
  }

  render() {
    return (
      <div>
        <select defaultValue={'0'} className="form-control" style={{height: 'inherit'}}
                ref={c => { this.input.select = c; }}>
          { [{value: '0', text: ''}, {value: '2', text: 'saturday evening'}, {value: '3', text: 'sunday morning'}, {value: '4', text: 'sunday evening'}, {value: '5', text: 'monday morning'}]
            .filter(entry => entry.value !== this.props.currentDuration)
            .map(entry => <option key={'durationchange_' + entry.value} value={entry.value}>{entry.text}</option>) }
        </select>
        <button className="btn btn-default btn-xs" onClick={()=>{ this.props.handleClick(this.input.select.value); }}>
          Change
        </button>
      </div>
    );
  }
}
