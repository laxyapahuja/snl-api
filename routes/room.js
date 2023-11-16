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
    let isTurn = false
    if (player) {
        let room = await Room.findOne({code: player.room_code});
        if (room) {
            if (player._id == room.admin) {
                isAdmin = true
            }
            if (player._id == room.turn) {
                isTurn = true
            }
            let players = await Player.find({active: true, room_code: player.room_code}, {name: 1, current_position: 1}).sort({created_on:1})
            res.json({success: true, room_code: player.room_code, name: player.name, is_admin: isAdmin, players: players, room_admin: room.admin, status: room.status, is_turn: isTurn, current_position: player.current_position})
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
        return;
    }
    let room = await Room.findOne({code: player.room_code})
    if (!room) {
        res.json({success: false, error: 'Room not found'})
        return;
    }
    if (room.status != "RUNNING") {
        res.json({success: false, error: 'Room not found'})
        return;
    }
    if (room.turn != player._id) {
        res.json({success: false, error: 'Not your turn'})
        return;
    }
    let dice = Math.floor((Math.random() * 6) + 1);
    let players = await Player.find({active: true, room_code: player.room_code}, {name: 1}).sort({created_on:1})
    console.log(players)
    for (let i = 0; i<room.player_limit; i++) {
        if (players[i]._id == room.turn) {
            if (i == (room.player_limit - 1)) {
                console.log('hey')
                room.turn = players[0]._id
                await room.save()
                break;
            } else {
                room.turn = players[i+1]._id
                console.log('he1')
                await room.save()
                break;
            }
        }
    }
    if (player.current_position + dice > 100) {
        res.json({success: true, dice: dice, current_position: player.current_position, message: `Dice: ${dice} Need a number smaller or equal to ${100-player.current_position}`});
        return;
    } else {
        if (player.current_position + dice == 100) {
            player.current_position = 100;
            await player.save()
            room.status = 'ENDED'
            await room.save()
            res.json({success: true, message: `Game Over. ${player.name} won the match.`})
            return;
        } else {
            if (config[player.current_position + dice]) {
                let oldPos = player.current_position + dice
                player.current_position = config[player.current_position + dice];
                await player.save()
                res.json({success: true, dice: dice, current_position: player.current_position, message: `Dice: ${dice} You arrived on ${oldPos} and encontered a ${oldPos > player.current_position ? 'snake' : 'ladder'}.`})
                return;
            } else {
                player.current_position = player.current_position + dice;
                await player.save()
                res.json({success: true, dice: dice, current_position: player.current_position, message: `Dice: ${dice} You arrived on ${player.current_position}.`})
                return;
            }
        }
    }
})

module.exports = router;