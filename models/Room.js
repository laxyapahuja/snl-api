const mongoose = require('mongoose')

const RoomSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    player_limit: {
        type: Number,
        required: true
    },
    admin: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['RUNNING', 'ENDED', 'WAITING'],
        default: 'WAITING'
    }
})

const Room = mongoose.model('Room', RoomSchema)

module.exports = Room