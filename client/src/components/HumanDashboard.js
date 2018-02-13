import React, { Component } from 'react';
import Human from './Human';

export default class HumanDashboard extends Component {

    onWinner(id) {
        this.props.onWinner(id);
    }

    isSelectable(humans) {
        return !humans.some(h => !h.response);
    }

    render() {
        const theRest = this.props.humans.filter(h => h.id !== this.props.myId);
        const lightning = <span role="img" aria-label="lightning">⚡️</span>
        const isSelectable = this.isSelectable(theRest);

        return (
            <ul className="list-group">
                {!!theRest.length && theRest.map(h => <Human key={h.id} human={h} selectable={isSelectable} onWinner={id => this.onWinner(id)} />)}

                {!theRest.length &&
                    <li className="list-group-item text-center h3"><i>
                        {lightning} No players yet {lightning}
                          </i></li>
                }
            </ul>
        )

    }

}