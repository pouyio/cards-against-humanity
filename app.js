const express = require('express')
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const raw = require('./data.json');
raw.blackCards = raw.blackCards.filter(e => e.pick === 1);
const PORT = 8080;

app.use(express.static('.'))
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/card', (req, res) => res.send(raw.whiteCards[Math.floor(Math.random() * raw.whiteCards.length)]));

let humans = [];

const _drawCards = () => {
    humans.map(h => {
        const cards = Array(10)
            .fill(1)
            .map(e => raw.whiteCards[Math.floor(Math.random() * raw.whiteCards.length)])
            .map((e, i) => ({ text: e, id: Buffer.from(e).toString('base64') }));
        io.to(h.id).emit('white-cards', cards)
    });
}

const _recalculateleader  = () => {
    let position = humans.findIndex(h => h.isLeader) + 1;
    if(position >= humans.length) position = 0;

    humans = humans.map(h => {
        h.isLeader = false;
        return h;
    });
    if(humans[position]) {
        humans[position].isLeader = true;
    }
    return humans;
}

const _newRownd = () => {
    humans = _recalculateleader();
    io.emit('new-round', raw.blackCards[Math.floor(Math.random() * raw.blackCards.length)].text, humans);
}

io.on('connection', (socket) => {

    socket.emit('just-connected', humans, socket.id);

    socket.on('enter-room', (nick) => {
        humans.push({ nick, id: socket.id, counter: 0, isLeader: false, leaderCounter: 0 });
        io.emit('enter-room', humans);
    });

    socket.on('disconnect', () => {
        humans = humans.filter(h => h.id !== socket.id);
        io.emit('leave-room', humans);
        _newRownd();
    });

    socket.on('ready', () => {
        const index = humans.findIndex(h => h.id === socket.id);
        humans[index].ready = true;
        const allReady = humans.filter(h => h.ready).length;
        if (humans.length === allReady && allReady > 1) {
            _drawCards();
            _newRownd();
        }
    });

    socket.on('card-selected', (cardId, cardtext) => {
        const leader = humans.find(h => h.isLeader);
        if (leader.id !== socket.id) {
            io.to(leader.id).emit('card-selected', cardId, cardtext, humans.find(h => h.id === socket.id).nick);
        }
    });
    
    socket.on('round-win', (humanId) => {
        const index = humans.findIndex(h => h.id === humanId);
        humans[index].counter++;
        io.to(humanId).emit('you-won');
        _newRownd();
    });

});



http.listen(PORT, () => console.log('listening on port: ', PORT));