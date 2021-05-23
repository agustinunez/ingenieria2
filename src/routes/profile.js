// ACA VA LO DE AGUS

// Constantes

const express = require('express');
const router = express.Router();
const { hasPermission } = require("../lib/auth");

router.get('/',hasPermission, (req, res) => {
    const user = req.user;

    res.render("perfil", {user});
});



// Aca exporto el enrutador

module.exports = router;