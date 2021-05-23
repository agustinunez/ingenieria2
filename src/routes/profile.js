// ACA VA LO DE AGUS

// Constantes

const express = require('express');
const router = express.Router();

// ACA VA EL BUSCAR VIAJE DE LUCAS

router.get('/', (req, res) => {
    res.render('home');
});



// Aca exporto el enrutador

module.exports = router;