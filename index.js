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
    }

    render() {
        return <Form hidden={false} />;
    }
}


class Form extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            hidden: this.props.hidden,
            nick: '',
            room: ''
        }

    }

    enterRoom() {
        const roomText = this.state.room;
        const $roomInfo = document.getElementById('roomInfo');
        socket.emit('enter-room', this.state.nick, roomText);
        $form.hidden = true;
        $roomInfo.innerHTML = `Room: ${roomText}`;
        $roomInfo.hidden = false;
        $ready.hidden = false;
    }

    handleChange(e, type) {
        this.setState({ [type]: e.target.value})
    }


    render() {
        return <div hidden={this.state.hidden}>
            <input placeholder="Nick" value={this.state.nick} onChange={(e) => this.handleChange(e, 'nick')}/>
            <input placeholder="Room" value={this.state.room} onChange={(e) => this.handleChange(e, 'room')}/>
            <button onClick={(e) => this.enterRoom(e)}>Enter</button>
            <pre>{this.state.nick}</pre>
            <pre>{this.state.room}</pre>
        </div>
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

socket.on('enter-room', _updateHumans);
socket.on('leave-room', _updateHumans);
socket.on('just-connected', (id, nick, room) => {
    myId = id;
    localStorage.setItem('nick', nick);
    localStorage.setItem('room', room);
});

socket.on('new-round', async (_blackCard, _humans) => {
    humans = _humans;
    _updateHumans(humans);
    blackCard.innerHTML = _blackCard;
    leader = humans.find(h => h.isLeader);
    const ul = document.getElementById('selectedCards');
    ul.innerHTML = '';
    if (leader && (leader.id === myId)) {
        document.getElementById('whiteCards').classList.add('disabled');
        document.getElementById('selectedCards').attributes.hidden = false;
    } else {
        document.getElementById('whiteCards').classList.remove('disabled');
        document.getElementById('selectedCards').attributes.hidden = true;
    }

    const totalCards = 10 - whiteCards.length;
    const res = await (await fetch(`/card/${totalCards}`)).json();
    whiteCards = whiteCards.concat(res.cards);
    _paintWhiteCards();
});

socket.on('you-won', () => alert('YOU WON THIS ROUND!'));

socket.on('card-selected', (_cardId, cardtext, _friendNick) => {
    const ul = document.getElementById('selectedCards');
    const nodeCard = document.createElement('LI');
    const textCard = document.createTextNode(`${_friendNick} - ${cardtext}`);
    nodeCard.appendChild(textCard);
    ul.appendChild(nodeCard);
});

checkSession();