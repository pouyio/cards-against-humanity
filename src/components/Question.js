import React, { Component } from 'react';
import sanitizeHtml from 'sanitize-html';

export default class Question extends Component {

    render() {
        const isDisabled = this.props.whiteCards.length < 10;
        const questionText = this.props.blackCard.replace(/\s*_\s*/, ' ______ ');
        const classes = `list-group list-group-flush  ${(this.props.disabled || isDisabled) ? 'disabled' : ''}`;
        return (
            <div>
                <div className="card bg-dark mb-3">
                    <div className="card-body text-white">
                        <h1 className="h4" dangerouslySetInnerHTML={{ __html: sanitizeHtml(questionText) }}></h1>
                    </div>
                </div>
                {!this.props.disabled &&
                    <ul className={classes}>
                        {this.props.whiteCards.map((c, i) => <WhiteCard key={`${c.id}-${i}`} card={c} onSelected={card => this.props.onSelected(card)} />)}
                    </ul>}
            </div>
        )

    }

}

class WhiteCard extends React.Component {

    render() {
        return <li className="btn btn-outline-dark pointer bold py-3"
            onClick={e => this.props.onSelected(this.props.card)}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(this.props.card.text) }}
            style={{ whiteSpace: 'inherit' }} />
    }

}