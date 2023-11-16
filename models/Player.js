const mongoose = require('mongoose')

const PlayerSchema = new mongoose.Schema({
    room_code: {
        type: String,
        required: true
    },
    access_token: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    current_position: {
        type: Number,
        default: 0
    },
    socket_id: {
        type: String,
        default: ''
    },
    active: {
        type: Boolean,
        default: true
    },
    created_on: {
        type: Date,
        default: Date.now()
    }
})

const Player = mongoose.model('Player', PlayerSchema)

module.exports = Player