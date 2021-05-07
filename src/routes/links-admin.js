// Constantes

const express = require('express');
const router = express.Router();
const pool = require('../database');

//Aca va, todo lo que yo quiera que pase si en el buscador pongo /algo

router.get('/chofer', async(req, res) => { 
    res.render('admin/choferes');
});

router.get('/choferJSON', async(req, res) => {
    const aux = await pool.query("SELECT id_usuario, name, lastname, username, email FROM usuario");
    res.send(aux);
});

// ESTO DE ABAJO ES PARA CADA TABLA

router.get('/insumos', async(req, res) => { 
    res.render('admin/insumos');
});

// router.get('/insumosJSON', async(req, res) => {
//     const aux = await pool.query("SELECT ID, name, precio, cantidad FROM insumos");
//     res.send(aux);
// });

router.get('/lugares', async(req, res) => { 
    res.render('admin/lugares');
});

// router.get('/lugaresJSON', async(req, res) => {
//     const aux = await pool.query("SELECT ID, name FROM lugares");
//     res.send(aux);
// });

router.get('/combis', async(req, res) => { 
    res.render('admin/combis');
});

// router.get('/combisJSON', async(req, res) => {
//     const aux = await pool.query("SELECT ID, patente, chofer, cantidadAsientos FROM combis");
//     res.send(aux);
// });

router.get('/viajes', async(req, res) => { 
    res.render('admin/viajes');
});

// router.get('/viajeJSON', async(req, res) => {
//     const aux = await pool.query("SELECT ID, chofer, combi, origen, destino, insumos FROM viaje");
//     res.send(aux);
// });




// Aca exporto el enrutador

module.exports = router;