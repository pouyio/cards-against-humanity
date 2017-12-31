import React, { Component } from 'react';
import Human from './Human';

export default class HumanDashboard extends Component {

    onWinner(id) {
        this.props.onWinner(id);
    }

    render() {
        const theRest = this.props.humans.filter(h => h.id !== this.props.myId);
        const lightning = <span role="img" aria-label="lightning">⚡️</span>

        return (
            <ul className="list-group">
                {!!theRest.length && theRest.map(h => <Human key={h.id} human={h} onWinner={id => this.onWinner(id)} />)}

                {!theRest.length &&
                    <li className="list-group-item text-center h3"><i>
                        {lightning} No players yet {lightning}
                          </i></li>
                }
            </ul>
        )

    }

}