import React, { Component } from 'react';
import sanitizeHtml from 'sanitize-html';
const getBiggerEmoji = (emoji) => <span style={{ transform: 'scale(1.4)', display: 'inline-block' }}>{emoji}</span>;
const getBeatingEmoji = (emoji) => <span style={{ display: 'inline-block' }} className="beat-forever">{getBiggerEmoji(emoji)}</span>

export default class Human extends Component {

    onSelected(humanId) {
        this.props.onWinner(humanId);
    }

    render() {

        const responseClass = this.props.human.response ? '' : ' text-center ';

        const safeResponse = { __html: sanitizeHtml(this.props.human.response || '') };

        const EmojiTimer = <span role="img" aria-label="timer" className="rotate-forever" style={{ display: 'inline-block' }}>⏳</span>

        return (
            <li className={'list-group-item card ' + responseClass}>
                {this.props.selectable && 'No selectable'}
                {!this.props.human.response && EmojiTimer}
                {this.props.human.response && <div className="card-body p-3" style={{ fontStyle: 'italic', fontSize: '1.2em' }} dangerouslySetInnerHTML={safeResponse} />}
                {this.props.human.response &&
                    <div className={`btn btn-outline-dark d-block ${!this.props.selectable ? 'disabled': ''}` } onClick={e => this.onSelected(this.props.human.id)}>
                        {getBeatingEmoji('🦄')} Winner {getBeatingEmoji('‼️')}
                    </div>
                }
            </li>
        )

    }

}