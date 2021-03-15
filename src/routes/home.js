// Constantes

const express = require('express');
const router = express.Router();



router.get('/', (req, res) => {
    res.render('home');
});



// Aca exporto el enrutador

module.exports = router;