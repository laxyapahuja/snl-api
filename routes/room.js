const express = require('express');
const router = express.Router();
const { generateHash } = require('random-hash');
const Room = require('../models/Room');
const Player = require('../models/Player');

let config = {
    7: 29,
    17:38,
    21: 82,
    34: 55,
    39: 3,
    47: 11,
    52: 90,
    72: 66,
    76: 95,
    78: 41,
    93: 56,
    99: 7
}

router.post('/create', async(req, res) => {
        let roomCode = Math.floor(Math.random() * 1000000);
        let accessToken = generateHash({length: 15});
        const player = new Player({
            room_code: roomCode,
            access_token: accessToken,
            name: req.body.name
        })
        await player.save();
        const room = new Room({
            code: roomCode,
            player_limit: req.body.playerLimit,
            admin: player._id
        })
        await room.save();
        res.json({success: true, access_token: accessToken});
});

router.post('/join', async(req, res) => {
    let room = await Room.findOne({code: req.body.roomCode});
    if (room) {
        let players = await Player.find({active: true, room_code: req.body.roomCode});
        if (players.length <= room.player_limit) {
            let accessToken = generateHash({length: 15});
            const player = new Player({
                room_code: req.body.roomCode,
                access_token: accessToken,
                name: req.body.name
            })
            await player.save();
            res.json({success: true, access_token: accessToken});
        } else {
            res.json({success: false, error: 'Player limit reached'})
        }
    } else {
        res.json({success: false, error: 'Room doesn\'t exist.'});
    } 
})

router.get('/', async(req, res) => {
    let player = await Player.findOne({access_token: req.query.token});
    let isAdmin = false
    if (player) {
        let room = await Room.findOne({code: player.room_code});
        if (room) {
            if (player._id == room.admin) {
                isAdmin = true
            }
            let players = await Player.find({active: true, room_code: player.room_code}, {name: 1})
            res.json({success: true, room_code: player.room_code, name: player.name, is_admin: isAdmin, players: players, room_admin: room.admin, status: room.status})
        } else {
            res.json({success: false, error: 'Room not found'})
        }
    } else {
        res.json({success: false, error: 'Player not found'})
    }
})

router.post('/start', async(req, res) => {
    let player = await Player.findOne({access_token: req.query.token});
    if (!player) {
        res.json({success: false, error: 'Player not found'})
    }
    let room = await Room.findOne({admin: player._id})
    if (!room) {
        res.json({success: false, error: 'Access denied'})
    }
    room.status = 'RUNNING'
    room.turn = player._id
    await room.save()
    res.json({success: true})
})

router.get('/status', async(req, res) => {
    let player = await Player.findOne({access_token: req.query.token});
    if (!player) {
        res.json({success: false, error: 'Player not found'})
    }
    let room = await Room.findOne({code: player.room_code})
    if (!room) {
        res.json({success: false, error: 'Room not found'})
    }
    res.json({success: true, status: room.status})
})

router.get('/dice', async(req, res) => {
    let player = await Player.findOne({access_token: req.query.token});
    if (!player) {
        res.json({success: false, error: 'Player not found'})
    }
    let room = await Room.findOne({code: player.room_code})
    if (!room) {
        res.json({success: false, error: 'Room not found'})
    }
    if (room.status != "RUNNING") {
        res.json({success: false, error: 'Room not found'})
    }
    if (room.turn != player._id) {
        res.json({success: false, error: 'Not your turn'})
    }
    let dice = Math.floor((Math.random() * 6) + 1);
    if (player.current_position + dice > 100) {
        res.json({success: true, dice: dice, current_position: player.current_position, message: `Need a number smaller or equal to ${100-player.current_position}`});
    }
    if (config[player.current_position + dice]) {
        player.current_position = config[player.current_position + dice];
        await player.save()
        res.json({success: true, dice: dice, current_position: config[player.current_position + dice], message: `You arrived on ${player.current_position + dice} and encontered a ${player.current_position + dice > config[player.current_position + dice] ? 'snake' : 'ladder'}.`})
    }
})

module.exports = router;