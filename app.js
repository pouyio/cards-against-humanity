const express = require('express')
const app = express();
const app2 = express();
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/aws/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/aws/fullchain.pem')
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

app2.use('*', (req, res) => res.redirect(`https://${req.headers.host}:${PORT}`));

app.use(express.static(path.join(__dirname, 'client/build')));

app.use((req, res, next) => {

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-xsrf-token, Authorization');

    if ('OPTIONS' == req.method) {
        res.sendStatus(200);
    } else {
        next();
    }
})

app.get('/card/:number', (req, res) => {
    const cards = new Array(+req.params.number).fill(1).map(c => {
        const cardText = _getRandomCards('whiteCards', 1);
        return { text: cardText, id: Buffer.from(cardText).toString('base64') };
    });
    res.json({ cards });
})

app.get('*', (req, res) => res.sendFile(path.join(__dirname + '/client/build/index.html')));

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
    const newCount = +io.sockets.connected[humanId].human.counter + amount;
    io.sockets.connected[humanId].human.counter = newCount;
}

io.on('connection', (socket) => {

    socket.on('enter-room', (nick, room, counter = 0) => {
        socket.join(room);
        socket.human = { nick, counter, room, isLeader: false, id: socket.id };
        socket.emit('just-connected', socket.id, nick, room);
        io.to(room).emit('enter-room', _getHumans(room));

        if (!socket.adapter.rooms[room].roomStarted) {
            socket.adapter.rooms[room].roomStarted = true;
            socket.adapter.rooms[room].blackCard = _newRound(room);
        } else {
            io.to(socket.id).emit('new-round', socket.adapter.rooms[socket.human.room].blackCard, _getHumans(room));
        }

    });

    socket.on('leave-room', (nick, room) => {
        socket.leave(room);
        if (!socket.human) return;

        const humans = _getHumans(socket.human.room).filter(h => h.id !== socket.id);

        io.to(socket.human.room).emit('leave-room', humans);
        if (socket.human.isLeader) {
            const room = socket.adapter.rooms[socket.human.room];
            if (room) room.blackCard = _newRound(socket.human.room);
        }

    });

    socket.on('disconnecting', () => {

        if (!socket.human) return;

        const humans = _getHumans(socket.human.room).filter(h => h.id !== socket.id);

        io.to(socket.human.room).emit('leave-room', humans);
        if (socket.human.isLeader) {
            const room = socket.adapter.rooms[socket.human.room];
            if (room) room.blackCard = _newRound(socket.human.room);
        }

    });

    socket.on('card-selected', (cardId, cardtext) => {
        io
            .to(_getHumans(socket.human.room, 'leader').id)
            .emit('card-selected', cardId, cardtext, socket.human.nick, socket.human.id);
    });

    socket.on('round-win', (humanId) => {
        _updateCounter(humanId, 1);
        const winner = _getHumans(socket.human.room, humanId);
        socket.to(socket.human.room).emit('you-won', winner);
        socket.adapter.rooms[socket.human.room].blackCard = _newRound(socket.human.room);
    });

});

server.listen(PORT, () => console.log(`Comics-api listening on port ${PORT}!`));
server2.listen(80);
