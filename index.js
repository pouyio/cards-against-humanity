const socket = io();
let humans = [];
let leader;
let myId;
let whiteCards = [];
const blackCard = document.getElementById('blackCard');
const $room = document.getElementById('room');
const $nick = document.getElementById('nick');
const $form = document.getElementById('form');
const $ready = document.getElementById('ready');
const $panel = document.getElementById('gamePanel');


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
            this.setState({ blackCard, humans });
            const res = await (await fetch(`/card/${10 - this.state.whiteCards.length}`)).json();
            this.setState((prevState) => ({whiteCards: prevState.whiteCards.concat(res.cards)}))
        });

        socket.on('card-selected', (_cardId, cardtext, _friendNick) => {
            console.log(_cardId, cardtext, _friendNick)
        })
    }

    _updateHumans(humans) {
        this.setState({ humans });
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
        this.setState({selectedCard: card})
        socket.emit('card-selected', card.id, card.text);
    }

    render() {
        const isLoged = this.state.nick && this.state.room;
        const leader = this.state.humans.find(h => h.isLeader);
        const isLeader = leader && leader.id === this.state.myId;

        return (
            <div>
                <Login isLoged={isLoged} onEnter={e => this.onEnter(e)} onLeave={e => this.onLeave()} />
                {this.state.room && <Room room={this.state.room} />}
                {isLoged && <HumanList myId={this.state.myId} humans={this.state.humans} />}
                {isLoged && <Question 
                                disabled={isLeader || this.state.selectedCard.id}
                                blackCard={this.state.blackCard}
                                whiteCards={this.state.whiteCards.filter(c => c.id !== this.state.selectedCard.id)}
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
                <button className="btn" onClick={e => this.leave(e)}>Leave</button>
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

    render() {
        return (
            <ul>
                {this.props.humans.map(h => {
                    return <Human key={h.id} human={h} me={this.props.myId === h.id} />
                })}
            </ul>
        )

    }

}

class Human extends React.Component {

    render() {
        const icon = this.props.human.isLeader
            ? '👑'
            : this.props.me 
                ? '🔵'
                : '⚫️';
        return (
            <li> {`${icon} ${this.props.human.nick}: ${this.props.human.counter}`} </li>
        )
    }

}

class Question extends React.Component {

    onSelected(id) {
        const card = this.props.whiteCards.find(c => c.id === id);
        this.props.onSelected(card);
    }

    render() {
        return (
            <div>
                <h1>{this.props.blackCard}</h1>
                <ul className={this.props.disabled ? 'disabled': ''}>
                    {this.props.whiteCards.map(c => <WhiteCard key={c.id} id={c.id} text={c.text} onSelected={id => this.onSelected(id)}/>)}
                </ul>
            </div>
        )
    }

}


class WhiteCard extends React.Component {

    onSelected() {
        this.props.onSelected(this.props.id);
    }

    render() {
        return <li><button onClick={e => this.onSelected()} className="btn">{this.props.text}</button></li>
    }

}

ReactDOM.render(<App />, document.getElementById('app'));

const checkSession = () => {
    const nick = localStorage.getItem('nick') || false;
    const room = localStorage.getItem('room') || false;

    if (!nick || !room) {
        $form.hidden = false;
    } else {
        const $roomInfo = document.getElementById('roomInfo');
        $roomInfo.innerHTML = `Room: ${room}`;
        $form.hidden = true;
        $roomInfo.hidden = false;
        $ready.hidden = false;
        socket.emit('enter-room', nick, room);
    }
}

const leaveRoom = () => {
    localStorage.clear();
    location.reload();
}

const humanPlus = event => socket.emit('round-win', event.target.dataset.id);

const _updateHumans = (_friends) => {
    humans = _friends;
    leader = humans.find(h => h.isLeader);
    const ul = document.getElementById('humans');
    ul.innerHTML = '';
    humans.forEach(human => {
        const node = document.createElement('LI');
        node.style.fontSize = human.id === myId ? 'larger' : 'inherit';
        node.style.fontWeight = human.id === myId ? 'bold' : 'inherit';
        let textnode = document.createTextNode(`${human.id === myId ? '🔵' : '⚫️'}️ ${human.nick} : ${human.counter}`);

        if (leader && (leader.id === human.id)) {
            textnode = document.createTextNode(`👑 ${human.nick} : ${human.counter}`);
        }
        node.appendChild(textnode);

        if (leader && leader.id === myId && human.id !== myId) {
            const nodePlus = document.createElement('BUTTON');
            const textPlus = document.createTextNode(' 🦄 Win');
            nodePlus.dataset.id = human.id;
            nodePlus.dataset.nick = human.nick;
            nodePlus.onclick = humanPlus;
            nodePlus.appendChild(textPlus);
            node.appendChild(nodePlus);
        }

        ul.appendChild(node);
    });
}

const selectCard = async event => {
    const cardId = event.target.dataset.id;
    const cardtext = event.target.dataset.cardtext;
    const cardLIToRemove = document.querySelector(`[data-id~="${cardId}"]`).parentNode;
    cardLIToRemove.parentNode.removeChild(cardLIToRemove);
    socket.emit('card-selected', cardId, cardtext);
    whiteCards = whiteCards.filter(c => c.id !== cardId);

    document.getElementById('whiteCards').classList.add('disabled');
}


const _paintWhiteCards = () => {
    const ul = document.getElementById('whiteCards');
    ul.innerHTML = '';
    whiteCards.forEach((whiteCard) => {
        const nodeLi = document.createElement('LI');
        const nodeBtn = document.createElement('BUTTON');
        const btnnode = document.createTextNode(whiteCard.text);
        nodeBtn.dataset.id = whiteCard.id;
        nodeBtn.dataset.cardtext = whiteCard.text;
        nodeBtn.onclick = selectCard;
        nodeBtn.appendChild(btnnode);
        nodeLi.appendChild(nodeBtn);
        ul.appendChild(nodeLi);
    });
}

const ready = () => {
    socket.emit('ready');
    $ready.hidden = true;
    $panel.hidden = false;
}

// socket.on('enter-room', _updateHumans);
// socket.on('leave-room', _updateHumans);
socket.on('just-connected', (id, nick, room) => {
    myId = id;
    localStorage.setItem('nick', nick);
    localStorage.setItem('room', room);
});

// socket.on('new-round', async (_blackCard, _humans) => {
//     humans = _humans;
//     _updateHumans(humans);
//     blackCard.innerHTML = _blackCard;
//     leader = humans.find(h => h.isLeader);
//     const ul = document.getElementById('selectedCards');
//     ul.innerHTML = '';
//     if (leader && (leader.id === myId)) {
//         document.getElementById('whiteCards').classList.add('disabled');
//         document.getElementById('selectedCards').attributes.hidden = false;
//     } else {
//         document.getElementById('whiteCards').classList.remove('disabled');
//         document.getElementById('selectedCards').attributes.hidden = true;
//     }

//     const totalCards = 10 - whiteCards.length;
//     const res = await (await fetch(`/card/${totalCards}`)).json();
//     whiteCards = whiteCards.concat(res.cards);
//     _paintWhiteCards();
// });

// socket.on('you-won', () => alert('YOU WON THIS ROUND!'));

// socket.on('card-selected', (_cardId, cardtext, _friendNick) => {
//     const ul = document.getElementById('selectedCards');
//     const nodeCard = document.createElement('LI');
//     const textCard = document.createTextNode(`${_friendNick} - ${cardtext}`);
//     nodeCard.appendChild(textCard);
//     ul.appendChild(nodeCard);
// });

// checkSession();