// TODO
// pasar a CRA
// añadir react alerts http://react-s-alert.jsdemo.be/
// recordar username on login
const socket = io();

const getBiggerEmoji = (emoji) => <span style={{ transform: 'scale(1.4)', display: 'inline-block' }}>{emoji}</span>;
const getBeatingEmoji = (emoji) => <span style={{ display: 'inline-block' }} className="beat-forever">{getBiggerEmoji(emoji)}</span>

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
                whiteCards: prevState.whiteCards.concat(res.cards)
            }))
        });

        socket.on('card-selected', (_cardId, cardtext, _friendNick, humanId) => {
            this.setState((prevState) => {
                const index = prevState.humans.findIndex(h => h.id === humanId);
                prevState.humans[index].response = cardtext;
                return prevState;
            })
        })

        socket.on('you-won', (human) => {
            localStorage.setItem('counter', human.counter);
            const msg = (this.state.myId === human.id) ? `🎊 You win 🎉` : `👎🏻 ${human.nick} won... 😒`;
            alert(msg);
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
        // REMOVE THIS SHIT destroying socket global variable and putting it inside the state
        location.reload();
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
        const imLeader = leader && leader.id === this.state.myId;
        const classNames = `d-flex flex-column ${isLoged ? '' : ' justify-content-center'}`;

        return (
            <div className={classNames} style={{ minHeight: '100vh' }}>

                {isLoged &&
                    <Room room={this.state.room} nick={this.state.nick}>
                        <Logout onLeave={e => this.onLeave()} />
                    </Room>
                }

                {imLeader && <Ribbon />}

                <div className="container">
                    <div className="row">

                        {!isLoged &&
                            <div className="col-12">
                                <Login isLoged={isLoged} onEnter={e => this.onEnter(e)} />
                            </div>
                        }

                        {isLoged &&

                            <div className="col-12">

                                <div className="d-flex flex-column py-3">

                                    {!imLeader &&
                                        <HumanList
                                            myId={this.state.myId}
                                            humans={this.state.humans} />}

                                    <Question
                                        disabled={imLeader || this.state.selectedCard.id}
                                        blackCard={this.state.blackCard}
                                        whiteCards={this.state.whiteCards}
                                        onSelected={card => this.onSelected(card)} />

                                    {imLeader &&
                                        <HumanDashboard
                                            myId={this.state.myId}
                                            humans={this.state.humans}
                                            onWinner={id => this.onWinner(id)} />}

                                </div>
                            </div>
                        }

                    </div>
                </div>

            </div>
        );
    }

}

class Ribbon extends React.Component {

    render() {
        return <div className="text-center text-white ribbon">
            <span> LEADER </span>
        </div>
    }

}

class Logout extends React.Component {

    render() {
        return <button className="btn btn-sm btn-outline-light py-1" onClick={e => this.props.onLeave()}>Leave ✈️</button>
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
        return <nav className="navbar bg-dark navbar-dark justify-content-start" style={{ backgroundRepeat: 'repeat', fontWeight: '300' }}>
            <div className="mr-auto">
                <span className="navbar-text mx-2 py-1">{this.props.nick}</span>
                <span className="navbar-text mx-2 py-1">Room: {this.props.room}</span>
            </div>
            {this.props.children}
        </nav>
    }

}

class HumanDashboard extends React.Component {

    onWinner(id) {
        this.props.onWinner(id);
    }

    render() {
        const theRest = this.props.humans.filter(h => h.id !== this.props.myId);

        return (
            <ul className="list-group">
                {!!theRest.length && theRest.map(h => <Human key={h.id} human={h} onWinner={id => this.onWinner(id)} />)}

                {!theRest.length &&
                    <li className="list-group-item text-center h3"><i> ⚡️ No players yet ⚡️ </i></li>
                }
            </ul>
        )

    }

}

class HumanList extends React.Component {

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

class Human extends React.Component {

    onSelected(humanId) {
        this.props.onWinner(humanId);
    }

    render() {

        const responseClass = this.props.human.response ? '' : ' text-center ';

        const safeResponse = { __html: sanitizeHtml(this.props.human.response || '') };

        const emojiTimer = <span className="rotate-forever" style={{ display: 'inline-block' }}>⏳</span>

        return (
            <li className={'list-group-item card ' + responseClass}>
                <div className={'text-capitalize' + (this.props.human.response ? ' small' : '')}>{this.props.human.nick} {!this.props.human.response ? emojiTimer : ''}</div>
                {this.props.human.response && <div className="card-body p-3" style={{ fontStyle: 'italic', fontSize: '1.2em' }} dangerouslySetInnerHTML={safeResponse} />}
                {this.props.human.response &&
                    <div className="btn btn-outline-dark d-block" onClick={e => this.onSelected(this.props.human.id)}>
                        {getBeatingEmoji('🦄')} Winner {getBeatingEmoji('‼️')}
                    </div>
                }
            </li>
        )

    }

}

class Question extends React.Component {

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

ReactDOM.render(<App />, document.getElementById('app'));