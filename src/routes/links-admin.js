// Constantes

const express = require('express');
const router = express.Router();
const pool = require('../database');

//Aca va, todo lo que yo quiera que pase si en el buscador pongo /algo

router.get('/chofer', async(req, res) => {
    
    res.render('admin/choferes');
})

router.get('/choferJSON', async(req, res) => {
    const aux = await pool.query("SELECT id_usuario, email FROM usuario");
    res.send(aux);
})

// Aca exporto el enrutador

module.exports = router;