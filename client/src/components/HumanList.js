import React, { Component } from 'react';

const getBiggerEmoji = (emoji) => <span role="img" aria-label="emoji" style={{ transform: 'scale(1.4)', display: 'inline-block' }}>{emoji}</span>;


export default class HumanList extends Component {

    render() {
        const me = this.props.humans.find(h => h.id === this.props.myId);
        const theRest = this.props.humans.filter(h => h.id !== this.props.myId);

        return (
            <ul className="d-flex flex-wrap list-unstyled">
                {me &&
                    <li style={{ flex: '1 1 auto', margin: '1px' }} className={'p-1 rounded align-items-baseline bold text-center ' + (me.isLeader ? ' bg-king ' : ' bg-white')}>
                        {getBiggerEmoji('💩')}  Me: <span className="badge badge-dark badge-pill">{me.counter}</span>
                    </li>}

                {theRest.map(h =>
                    <li key={h.id} style={{ flex: '1 1 auto', margin: '1px' }} className={'p-1 rounded align-items-baseline text-center ' + (h.isLeader ? ' bg-king ' : ' bg-white')}>
                        <div className="text-capitalize">{h.nick}: <span className="badge badge-dark badge-pill">{h.counter}</span></div>
                    </li>)}
            </ul>
        )

    }

}