const express = require('express')
const app = express();
const app2 = express();
const fs = require('fs');
const https = require('https');
const http = require('http');
const options = {
                key: fs.readFileSync('/etc/letsencrypt/live/comic/privkey.pem'),
                cert: fs.readFileSync('/etc/letsencrypt/live/comic/fullchain.pem')
        }
const server2 = http.createServer(app2);
const server = https.createServer(options, app);
const io = require('socket.io').listen(server);
const raw = require('./data.json');
raw.blackCards = raw.blackCards.filter(e => e.pick === 1);
const PORT = 8083;

const _getRandomCards = (type, number) => {
    const _card = () => raw[type][Math.floor(Math.random() * raw[type].length)];

    if (number === 1) {
        return _card();
    } else {
        return Array(10).fill(1).map(_card);
    }
}

app2.use('*', (req, res) => {
  res.redirect('https://' + req.headers.host + ':' + PORT);
});

app.use(express.static('.'))
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/card/:number', (req, res) => {
    const cards = new Array(+req.params.number).fill(1).map(c => {
        const cardText = _getRandomCards('whiteCards', 1);
        return { text: cardText, id: Buffer.from(cardText).toString('base64') };
    });
    res.json({ cards });
})

const _getHumans = (room, id = false) => {
    const humans = [];

    if (id && id !== 'leader') {
        return io.sockets.connected[id].human;
    }

    Object.keys(io.sockets.connected).forEach((socketID) => {
        const human = io.sockets.connected[socketID].human;
        if (human && human.room === room) humans.push(human);
    });

    if (id === 'leader') return humans.find(h => (h.isLeader && h.room === room));

    return humans;
}

const _recalculateleader = (room) => {
    const humans = Object.values(io.sockets.connected)
        .filter(s => s.human && (s.human.room === room))
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
    const blackCard = _getRandomCards('blackCards', 1).text;
    io.to(room).emit('new-round', blackCard, _recalculateleader(room));
    return blackCard;
}

const _updateCounter = (humanId, amount) => {
    io.sockets.connected[humanId].human.counter += amount;
}

io.on('connection', (socket) => {

    socket.on('enter-room', (nick, room) => {
        socket.join(room);
        socket.human = { nick, counter: 0, isLeader: false, id: socket.id, room };
        socket.emit('just-connected', socket.id, nick, room);
        io.to(room).emit('enter-room', _getHumans(room));
    });

    socket.on('disconnecting', () => {

        if (!socket.human) return;

        const humans = _getHumans(socket.human.room).filter(h => h.id !== socket.id);

        io.to(socket.human.room).emit('leave-room', humans);
        if (socket.human.isLeader) {
            socket.adapter.rooms[socket.human.room].blackCard = _newRound(socket.human.room);
        }

    });

    socket.on('ready', () => {
        socket.human.ready = true;
        const room = socket.human.room;
        const humans = _getHumans(room);
        if (!socket.adapter.rooms[room].roomStarted) {
            socket.adapter.rooms[room].roomStarted = true;
            socket.adapter.rooms[room].blackCard = _newRound(room);
        } else {
            io.to(socket.id).emit('new-round', socket.adapter.rooms[socket.human.room].blackCard, humans);
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
        socket.adapter.rooms[socket.human.room].blackCard = _newRound(socket.human.room);
    });

});

server.listen(PORT, () => console.log(`Comics-api listening on port ${PORT}!`));
server2.listen(80);
