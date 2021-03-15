// Constantes

const express = require('express');
const router = express.Router();



router.get('/', (req, res) => {
    res.send('Que onda mundo');
});



// Aca exporto el enrutador

module.exports = router;