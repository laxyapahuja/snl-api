const express = require('express');
const router = express.Router();
const Player = require('../models/Player');

router.get('/socket', async (req, res) => {
    let player = await Player.findOne({access_token: req.query.token});
    if (player) {
        player.socket_id = req.query.socket;
        player.active = true;
        await player.save();
        res.json({success: true})
    } else {
        res.json({success: false, error: 'Player not found'})
    }
});

module.exports = router;