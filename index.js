const socket = io();

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            room: localStorage.getItem('room') || false,
            nick: localStorage.getItem('nick') || false,
            counter: localStorage.getItem('counter') || 0,
            humans: [],
            blackCard: '',
            whiteCards: [],
            selectedCard: {}
        };
        if (this.state.room && this.state.nick) socket.emit('enter-room', this.state.nick, this.state.room, this.state.counter);

        socket.on('enter-room', (humans) => this._updateHumans(humans));

        socket.on('leave-room', (humans) => this._updateHumans(humans));

        socket.on('just-connected', (id, nick, room) => {
            localStorage.setItem('nick', nick);
            localStorage.setItem('room', room);
            this.setState({ nick, room, myId: id });
        });

        socket.on('new-round', async (blackCard, humans) => {
            const res = await (await fetch(`/card/${10 - this.state.whiteCards.length}`)).json();
            this.setState((prevState) => ({
                blackCard,
                humans,
                selectedCard: {},
                whiteCards: prevState.whiteCards.concat(res.cards) }))
        });

        socket.on('card-selected', (_cardId, cardtext, _friendNick, humanId) => {
            this.setState((prevState) => {
                const index = prevState.humans.findIndex(h => h.id === humanId);
                prevState.humans[index].response = cardtext;
                return prevState;
            })
        })

        socket.on('you-won', (newCount) => {
            localStorage.setItem('counter', newCount);
            alert(`You won this round!`);
        });
    }

    _updateHumans(humans) {
        this.setState((prevState) => {
            const newHumans = humans.reduce((acc, human) => {
                const humanFound = prevState.humans.find(h => h.id === human.id)
                return humanFound ? acc.concat([humanFound]) : acc.concat([human]);
            }, []);
            return { humans: newHumans };
        });
    }

    onEnter(values) {
        socket.emit('enter-room', values.nick, values.room, this.state.counter);
    }

    onLeave(event) {
        socket.emit('leave-room', this.state.nick, this.state.room);
        localStorage.clear();
        this.setState({ nick: false, room: false });
    }

    onSelected(card) {
        this.setState(prevState => ({ whiteCards: prevState.whiteCards.filter(c => c.id !== card.id) }));
        socket.emit('card-selected', card.id, card.text);
    }

    onWinner(id) {
        socket.emit('round-win', id);
    }

    render() {
        const isLoged = this.state.nick && this.state.room;
        const leader = this.state.humans.find(h => h.isLeader);
        const isLeader = leader && leader.id === this.state.myId;
        const classNames = `d-flex flex-column ${isLoged ? '' : ' justify-content-center'}`;

        const columnOrder = `d-flex flex-column${isLeader ? '-reverse' : ''}`

        return (
            <div className={classNames} style={{ minHeight: '100vh' }}>
                <div className="container">
                    <div className="row">

                        {isLoged &&

                            <div className="col-12">
                                <div className="d-flex justify-content-between">
                                    <Room room={this.state.room} nick={this.state.nick} />
                                    <Logout onLeave={e => this.onLeave()} />
                                </div>

                                <div className={columnOrder}>
                                    <HumanList
                                        myId={this.state.myId}
                                        humans={this.state.humans}
                                        onWinner={id => this.onWinner(id)} />

                                    <Question
                                        disabled={isLeader || this.state.selectedCard.id}
                                        blackCard={this.state.blackCard}
                                        whiteCards={this.state.whiteCards}
                                        onSelected={card => this.onSelected(card)} />

                                </div>
                            </div>
                        }
                        {!isLoged &&
                            <div className="col-12">
                                <Login isLoged={isLoged} onEnter={e => this.onEnter(e)} />
                            </div>
                        }

                    </div>
                </div>
            </div>
        );
    }

}

class Logout extends React.Component {

    render() {
        return <button className="btn btn-link" onClick={e => this.props.onLeave()}>Leave</button>
    }

}
class Login extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            nick: '',
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

class Room extends React.Component {

    render() {
        return <div>
            <button className="btn disabled btn-link">{this.props.nick}</button>
            <button className="btn disabled btn-link">Room: {this.props.room}</button>
        </div>
    }

}

class HumanList extends React.Component {

    onWinner(id) {
        this.props.onWinner(id);
    }

    render() {
        const leader = this.props.humans.find(h => h.isLeader);
        const imLeader = leader && leader.id === this.props.myId;
        return (
            <div className="">
                <ul className="list-group d-flex">
                    {this.props.humans.map(h => {
                        return <Human key={h.id} human={h} imLeader={imLeader} me={this.props.myId === h.id} onWinner={id => this.onWinner(id)} />
                    })}
                </ul>
            </div>
        )

    }

}

class Human extends React.Component {

    onSelected(humanId) {
        this.props.onWinner(humanId);
    }

    render() {        
        const colorClass = this.props.human.isLeader ? ' bg-king ' : '';

        const meClass = ' bold ';
        const responseClass = this.props.human.response ? '' : ' text-center ';

        const judgeButton = this.props.imLeader && !this.props.me && this.props.human.response
            ? <div className="btn btn-outline-dark d-block" onClick={e => this.onSelected(this.props.human.id)}><span style={{transform: 'scale(1.4)'}}>🦄</span> Winner <span style={{transform: 'scale(1.4)'}}>‼️</span></div>
            : null;

        const safeResponse = { __html: sanitizeHtml(this.props.human.response || '') };

        if(this.props.me) {
            return <li className={'list-group-item ' + colorClass + meClass + responseClass}>
                        <span className="d-inline-block" style={{transform: 'scale(1.4)'}}>💩</span> Me: {this.props.human.counter}
                        {this.props.human.response && <span dangerouslySetInnerHTML={safeResponse} />}
                    </li>
        }else {
            return  <li className={'list-group-item card ' + colorClass + responseClass}>
                        <div className="text-capitalize">{this.props.human.nick}: {this.props.human.counter}
                        </div>
                        {this.props.human.response && <div className="card-body p-3" style={{fontStyle: 'italic'}} dangerouslySetInnerHTML={safeResponse} />}
                        {judgeButton}
                    </li>
        }

    }

}

class Question extends React.Component {

    render() {
        const isDisabled = this.props.whiteCards.length < 10;
        const questionText = this.props.blackCard.replace(/\s*_\s*/, ' ______ ');
        const classes = `list-group list-group-flush  ${(this.props.disabled || isDisabled) ? 'disabled' : ''}`;
        return (
            <div>

                <div className="card bg-dark my-4">
                    <div className="card-body text-white">
                        <h1 className="h3" dangerouslySetInnerHTML={{ __html: sanitizeHtml(questionText) }}></h1>
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
        return <li className="btn btn-outline-dark pointer bold"
            onClick={e => this.props.onSelected(this.props.card)}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(this.props.card.text) }} 
            style={{whiteSpace: 'inherit'}}/>
    }

}

ReactDOM.render(<App />, document.getElementById('app'));