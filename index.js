const socket = io();

class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            room: localStorage.getItem('room') || false,
            nick: localStorage.getItem('nick') || false,
            humans: [],
            blackCard: '',
            whiteCards: [],
            selectedCard: {}
        };
        if (this.state.room && this.state.nick) socket.emit('enter-room', this.state.nick, this.state.room);

        socket.on('enter-room', (humans) => this._updateHumans(humans));
        
        socket.on('leave-room', (humans) => this._updateHumans(humans));

        socket.on('just-connected', (id, nick, room) => {
            localStorage.setItem('nick', nick);
            localStorage.setItem('room', room);
            this.setState({ nick, room, myId: id });
        });

        socket.on('new-round', async (blackCard, humans) => {
            this.setState({ blackCard, humans, selectedCard: {} });
            const res = await (await fetch(`/card/${10 - this.state.whiteCards.length}`)).json();
            this.setState((prevState) => ({whiteCards: prevState.whiteCards.concat(res.cards)}))
        });

        socket.on('card-selected', (_cardId, cardtext, _friendNick, humanId) => {
            this.setState((prevState) => {
                const index = prevState.humans.findIndex(h => h.id === humanId);
                prevState.humans[index].response = cardtext;
                return prevState;
            })
        })

        socket.on('you-won', () => alert('YOU WON THIS ROUND!'));
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
        socket.emit('enter-room', values.nick, values.room);
    }

    onLeave(event) {
        socket.emit('leave-room', this.state.nick, this.state.room);
        localStorage.removeItem('nick');
        localStorage.removeItem('room');
        // TODO REMOVE THIS SHIT
        location.reload()
        // socket.disconnect();
        this.setState({ nick: false, room: false });
    }

    onSelected(card) {
        this.setState(prevState => ({whiteCards: prevState.whiteCards.filter(c => c.id !== card.id)}));
        socket.emit('card-selected', card.id, card.text);
    }

    onWinner(id) {
        socket.emit('round-win', id);
    }

    render() {
        const isLoged = this.state.nick && this.state.room;
        const leader = this.state.humans.find(h => h.isLeader);
        const isLeader = leader && leader.id === this.state.myId;

        return (
            <div>
                <Login isLoged={isLoged} onEnter={e => this.onEnter(e)} onLeave={e => this.onLeave()} />
                {this.state.room && <Room room={this.state.room} />}
                {isLoged && <HumanList myId={this.state.myId} humans={this.state.humans} onWinner={id => this.onWinner(id)}/>}
                {isLoged && <Question 
                                disabled={isLeader || this.state.selectedCard.id}
                                blackCard={this.state.blackCard}
                                whiteCards={this.state.whiteCards}
                                onSelected={card => this.onSelected(card)}/>}
            </div>
        );
    }

}


class Login extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            nick: '',
            room: ''
        }
    }

    handleChange(event, type) {
        this.setState({ [type]: event.target.value })
    }

    enter(event) {
        this.props.onEnter(this.state);
    }

    leave(event) {
        this.props.onLeave();
    }

    render() {
        let render;
        if (this.props.isLoged) {
            render = <div>
                <button className="btn" onClick={e => this.leave(e)}>Leave</button>
            </div>
        } else {
            render = <div>
                <input placeholder="Nick" value={this.state.nick} onChange={e => this.handleChange(e, 'nick')} />
                <input placeholder="Room" value={this.state.room} onChange={e => this.handleChange(e, 'room')} />
                <button className="btn" onClick={e => this.enter(e)}>Enter</button>
            </div>
        }
        return render;
    }

}

class Room extends React.Component {

    render() {
        return (
            <div>
                <p>Room: {this.props.room}</p>
            </div>
        );
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
            <ul>
                {this.props.humans.map(h => {
                    return <Human key={h.id} human={h} imLeader={imLeader} me={this.props.myId === h.id} onWinner={id => this.onWinner(id)} />
                })}
            </ul>
        )

    }

}

class Human extends React.Component {

    onSelected(humanId) {
        this.props.onWinner(humanId);
    }
    
    render() {
        const icon = this.props.human.isLeader
            ? '👑'
            : this.props.me 
                ? '🔵'
                : '⚫️';

        const judgeButton = this.props.imLeader && !this.props.me && this.props.human.response
            ? <button onClick={e => this.onSelected(this.props.human.id)} className="btn"> 🦄 Win</button>
            : null;

        const safeResponse = {__html: sanitizeHtml(this.props.human.response || '')};
        return (
            <li>
                {`${icon} ${this.props.human.nick}: ${this.props.human.counter} `}
                <span  dangerouslySetInnerHTML={safeResponse}/>
                {judgeButton} 
            </li>
        )
    }

}

class Question extends React.Component {

    render() {
        const isDisabled = this.props.whiteCards.length < 10;
        const questionText = this.props.blackCard.replace(/\s*_\s*/, ' ______ ');
        return (
            <div>
                <h1 dangerouslySetInnerHTML={{__html: sanitizeHtml(questionText)}}></h1>
                <ul className={this.props.disabled || isDisabled ? 'disabled': ''}>
                    {this.props.whiteCards.map((c, i) => <WhiteCard key={`${c.id}-${i}`} card={c} onSelected={card => this.props.onSelected(card)}/>)}
                </ul>
            </div>
        )
    }

}


class WhiteCard extends React.Component {

    render() {
        return <li><button
                onClick={e => this.props.onSelected(this.props.card)}
                className="btn"
                dangerouslySetInnerHTML={{__html: sanitizeHtml(this.props.card.text)}}></button></li>
    }

}

ReactDOM.render(<App />, document.getElementById('app'));