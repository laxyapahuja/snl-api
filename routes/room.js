const express = require('express');
const router = express.Router();
const { generateHash } = require('random-hash');
const Room = require('../models/Room');
const Player = require('../models/Player');

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
            res.json({success: true, room_code: player.room_code, name: player.name, is_admin: isAdmin, players: players, room_admin: room.admin})
        } else {
            res.json({success: false, error: 'Room not found'})
        }
    } else {
        res.json({success: false, error: 'Player not found'})
    }
})

module.exports = router;