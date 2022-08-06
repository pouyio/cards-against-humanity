import React, {Component} from 'react'

export default class Login extends Component {

    constructor(props) {
        super(props);
        this.state = {
            nick: this.props.nick,
            room: '1'
        }
    }

    handleChange(event, type) {
        this.setState({ [type]: String(event.target.value) })
    }

    handleKeyPress(event) {
        if (event.key === 'Enter') this.enter();
    }

    enter() {
        if(!this.state.nick) return;
        this.props.onEnter(this.state);
    }

    render() {
        return <div className="d-inline-flex w-100">
            <div style={{ flexBasis: '70%' }}>
                <input
                    className="form-control"
                    placeholder="Nick"
                    value={this.state.nick}
                    onChange={e => this.handleChange(e, 'nick')}
                    onKeyPress={e => this.handleKeyPress(e)} />
                <select className="form-control" value={`${this.state.room}`} onChange={e => this.handleChange(e, 'room')}>
                    {Array.from(Array(20).keys()).map(v => <option key={v} value={v}>Room: {v}</option>)}
                </select>
            </div>
            <button style={{ flexBasis: '30%' }} className="btn bg-dark text-white" onClick={e => this.enter(e)}>Enter</button>
        </div >;
    }

}