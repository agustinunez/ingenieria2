// Constantes

const express = require('express');
const router = express.Router();
const pool = require('../database');



//Aca va, todo lo que yo quiera que pase si en el buscador pongo /algo
router.get('/login', (req,res)=>{
    res.render('auth/login');
})

router.get('/signup', (req,res)=>{
    res.render('auth/signup');
})

router.post('/login', (req,res)=>{
    res.send('recibido');
})

router.post('/signup', (req,res)=>{
    res.send('recibidoo');
})


// Aca exporto el enrutador

module.exports = router;