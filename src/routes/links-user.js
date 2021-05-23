// ACA VA LO DE FACU
// Constantes
const express = require('express');
const router = express.Router();
const { hasPermission } = require('../lib/auth');
const pool = require('../database');
var dateFormat = require("dateformat");

// ACA VA EL BUSCAR VIAJE DE LUCAS

router.get('/tickets', hasPermission, (req, res) => {
    res.render('user/tickets');
})



router.get("/ticketsJSON", hasPermission, async (req, res) => {
    const usuario = req.user
    id_usuario=usuario.id_usuario
    const aux = await pool.query(
        "SELECT viaje,estado,cantidad FROM usuario_viaje WHERE usuario=?",[id_usuario]
    );
    for (let i = 0; i < aux.length; i++) {
        viaje= await pool.query("SELECT ruta,fecha_salida,fecha_llegada,hora_salida,hora_llegada FROM viaje WHERE id_viaje=?",[aux[i].viaje]);
        fecha_salida=viaje[0].fecha_salida
        fecha_salida=dateFormat(fecha_salida, "yyyy-mm-dd");
        aux[i].fecha_salida=fecha_salida
        fecha_llegada=viaje[0].fecha_llegada
        fecha_llegada=dateFormat(fecha_llegada, "yyyy-mm-dd");
        aux[i].fecha_llegada=fecha_llegada
        hora_salida=viaje[0].hora_salida
        aux[i].hora_salida=hora_salida
        hora_llegada=viaje[0].hora_llegada
        aux[i].hora_llegada=hora_llegada
        const rutasViaje = await pool.query("SELECT r.origen AS origenid ,r.destino AS destinoid,r.id_ruta AS id_ruta,l.nombre AS nombreorigen,l2.nombre AS nombredestino FROM ruta r INNER JOIN lugar l ON (r.origen=l.id_lugar) INNER JOIN lugar l2 ON (r.destino=l2.id_lugar) WHERE id_ruta=?", [viaje[0].ruta]);
        aux[i].ruta = rutasViaje[0].nombreorigen + ' - ' + rutasViaje[0].nombredestino;
        //aux[i].ruta = rutasViaje[0].nombreorigen + ' - ' + rutasViaje[0].nombredestino;
    }
    
    res.send(aux);
});
// Aca exporto el enrutador

module.exports = router;






