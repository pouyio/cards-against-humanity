import React, { Component } from 'react';

export default class Logout extends Component {

    render() {
        return <button className="btn btn-sm btn-outline-light py-1" onClick={e => this.props.onLeave()}>Leave <span role="img" aria-label="plane">✈️</span></button>
    }

}