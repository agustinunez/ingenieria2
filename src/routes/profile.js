// Constantes

const express = require('express');
const router = express.Router();
const { hasPermission } = require("../lib/auth");
var dateFormat = require("dateformat");

router.get('/',hasPermission, (req, res) => {
    const user = req.user;
    user.birthdate= dateFormat(user.birthdate, "yyyy-mm-dd");
    const username = user.username.toUpperCase();
    res.render("perfil", {user, username});
});



// Aca exporto el enrutador

module.exports = router;