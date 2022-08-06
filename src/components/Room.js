import React, {Component} from 'react';

export default class Room extends Component {

    render() {
        return <nav className="navbar bg-dark navbar-dark justify-content-start" style={{ backgroundRepeat: 'repeat', fontWeight: '300' }}>
            <div className="mr-auto">
                <span className="navbar-text mx-2 py-1">{this.props.nick}</span>
                <span className="navbar-text mx-2 py-1">Room: {this.props.room}</span>
            </div>
            {this.props.children}
        </nav>
    }

}