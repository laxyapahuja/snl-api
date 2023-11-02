const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const Player = require('./models/Player');
require('dotenv').config();

const indexRouter = require('./routes/index');
const roomRouter = require('./routes/room');
const playerRouter = require('./routes/player');
const Room = require('./models/Room');


const app = express();

mongoose.connect(process.env.MONGODB_URL, { useUnifiedTopology: true, useNewUrlParser: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err))

const port = process.env.PORT || 4000;
const server = app.listen(port, (err) => {
    console.log(`Server started on ${port}!`);
    if (err) throw err;
});

const io = socketIO(server, { cors: true, origins: '*:*' });

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);
app.use('/room', roomRouter);
app.use('/player', playerRouter);

io.on('connection', socket => {
    console.log('a user connected: ' + socket.id);
    socket.join(socket.request._query['room'])
    socket.on('disconnect', async() => { // Disconnect event
        let player = await Player.findOne({ socket_id: socket.id });
        if (player) {
            console.log(player.room_code)
            io.to(player.room_code).emit('join');
            player.active = false;
            await player.save()
        }
    })
    socket.on('join', async(room) => { // Join event
        io.to(room).emit('join');
    })
})

module.exports = app;