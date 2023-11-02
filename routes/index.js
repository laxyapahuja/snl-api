const express = require('express');
const router = express.Router();
const { generateHash } = require('random-hash');
const Player = require('../models/Player');

router.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});

module.exports = router;