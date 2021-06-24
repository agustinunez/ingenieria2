// Constantes

const express = require('express');
const router = express.Router();
const { hasPermission } = require("../lib/auth");

const app = express()

router.get('/statistics', hasPermission, (req, res) => {
    const key = req.user.img;
    res.render("chofer/statistics", {key});
});

module.exports = router;