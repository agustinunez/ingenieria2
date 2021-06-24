const express = require('express');
const router = express.Router();
const { hasPermission } = require('../lib/auth');
const pool = require('../database');
var dateFormat = require("dateformat");
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const jsonUtils = require('../lib/json_utils')

router.get('/tickets', hasPermission, (req, res) => {
    const key = req.user.img;
    res.render('user/tickets', { key });
})


router.get("/aRealizarJSON", hasPermission, isChofer, async (req, res) => {
    const usuario = req.user
    id_usuario = usuario.id_usuario
    const aux = await pool.query(
        "SELECT id_usuarioviaje,viaje,estado,cantidad,precio FROM usuario_viaje WHERE usuario=?", [id_usuario]
    );
    for (let i = 0; i < aux.length; i++) {
        viaje = await pool.query("SELECT ruta,fecha_salida,fecha_llegada,hora_salida,hora_llegada FROM viaje WHERE id_viaje=?", [aux[i].viaje]);
        fecha_salida = viaje[0].fecha_salida
        fecha_salida = dateFormat(fecha_salida, "yyyy-mm-dd");
        aux[i].fecha_salida = fecha_salida
        fecha_llegada = viaje[0].fecha_llegada
        fecha_llegada = dateFormat(fecha_llegada, "yyyy-mm-dd");
        aux[i].fecha_llegada = fecha_llegada
        hora_salida = viaje[0].hora_salida
        aux[i].hora_salida = hora_salida
        hora_llegada = viaje[0].hora_llegada
        aux[i].hora_llegada = hora_llegada
        const rutasViaje = await pool.query("SELECT r.origen AS origenid ,r.destino AS destinoid,r.id_ruta AS id_ruta,l.nombre AS nombreorigen,l2.nombre AS nombredestino FROM ruta r INNER JOIN lugar l ON (r.origen=l.id_lugar) INNER JOIN lugar l2 ON (r.destino=l2.id_lugar) WHERE id_ruta=?", [viaje[0].ruta]);
        aux[i].ruta = rutasViaje[0].nombreorigen + ' - ' + rutasViaje[0].nombredestino;
    }

    res.send(aux);
});