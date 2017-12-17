const express = require('express')
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const raw = require('./data.json');
raw.blackCards = raw.blackCards.filter(e => e.pick === 1);
const PORT = 8080;
let leavingRoom;

const _getRandomCards = (type, number) => {
    const _card = () => raw[type][Math.floor(Math.random() * raw[type].length)];

    if (number === 1) {
        return _card();
    } else {
        return Array(10).fill(1).map(_card);
    }
}

app.use(express.static('.'))
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/card', (req, res) => res.send(_getRandomCards('whiteCards', 1)));

const _getHumans = (room, id = false) => {
    const humans = [];

    if(id && id !== 'leader' ) {
        return io.sockets.connected[id].human;
    }

    Object.keys(io.sockets.connected).forEach((socketID) => {
        const human = io.sockets.connected[socketID].human;
        if (human && human.room === room) humans.push(human);
    });

    if (id === 'leader') return humans.find(h => (h.isLeader && h.room === room));

    return humans;
}

const _drawCards = (room) => {
    const humans = _getHumans(room);
    humans.map(h => {
        const cards = _getRandomCards('whiteCards', 10).map((e, i) => ({ text: e, id: Buffer.from(e).toString('base64') }));
        io.to(h.id).emit('white-cards', cards)
    });
}

const _recalculateleader = (room) => {
    const humans = Object.values(io.sockets.connected)
        .filter(s => s.human && ( s.human.room === room))
        .map(s => s.human);

    if (!humans.length) return [];

    const leaderIndex = humans.findIndex(h => h.isLeader);
    let newLeaderIndex = 0;

    if (!(leaderIndex === -1) && !(leaderIndex + 1 === humans.length)) {
        newLeaderIndex = leaderIndex + 1;
    }

    if (leaderIndex !== -1) humans[leaderIndex].isLeader = false;
    humans[newLeaderIndex].isLeader = true;

    return _getHumans(room);
}

const _newRound = (room) => {
    io.to(room).emit('new-round', _getRandomCards('blackCards', 1).text, _recalculateleader(room));
}

const _updateCounter = (humanId, amount) => {
    io.sockets.connected[humanId].human.counter += amount;
}

io.on('connection', (socket) => {

    socket.emit('just-connected', socket.id);

    socket.on('enter-room', (nick, room) => {
        socket.join(room);
        socket.human = { nick, counter: 0, isLeader: false, id: socket.id, room};
        io.to(room).emit('enter-room', _getHumans(room));
    });

    socket.on('disconnect', () => {
    
        if(!socket.human) return; 
    
        const leader = _getHumans(socket.human.room, 'leader');
        
        
        if (leader && (leader.id === socket.id)) {
            _recalculateleader(socket.human.room);
        }

        const humans = _getHumans(socket.human.room);
        
        io.to(socket.human.room).emit('leave-room', humans);
        if (humans.length > 2) return;
        _newRound(socket.human.room);

    });

    socket.on('ready', () => {
        socket.human.ready = true;
        const room = socket.human.room
        const humans = _getHumans(room);
        const humansReady = humans.filter(h => h.ready).length;
        if (humans.length === humansReady && humansReady > 1) {
            _drawCards(room);
            _newRound(room);
        }
    });

    socket.on('card-selected', (cardId, cardtext) => {
        io
            .to(_getHumans(socket.human.room, 'leader').id)
            .emit('card-selected', cardId, cardtext, socket.human.nick);
    });

    socket.on('round-win', (humanId) => {
        _updateCounter(humanId, 1);
        io.to(humanId).emit('you-won');
        _newRound(socket.human.room);
    });

});

http.listen(PORT, () => console.log('listening on port: ', PORT));