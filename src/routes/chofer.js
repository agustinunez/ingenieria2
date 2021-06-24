// Constantes

const express = require('express');
const router = express.Router();
const { hasPermission, isChofer } = require("../lib/auth");
const moment = require('moment');
var dateFormat = require("dateformat");
const app = express()
const pool = require('../database');

router.get('/arealizar', hasPermission, (req, res) => {
    const key = req.user.img;
    res.render('chofer/arealizar', { key });
})


router.get("/arealizarJSON", hasPermission, isChofer, async (req, res) => {
    const usuario = req.user
    id_usuario = usuario.id_usuario
    finalizado="Finalizado"
    const aux = await pool.query(
        "SELECT * FROM chofer_viaje WHERE chofer=? AND estado!=?", [id_usuario,finalizado]
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

router.post("/comenzar/", hasPermission, isChofer, async (req, res) => {
    const { id } = req.body;
    viaje = await pool.query("SELECT viaje,estado FROM chofer_viaje WHERE id_viajechofer=?",[id])
    if(viaje[0].estado == "Pendiente"){
        estado_enCurso="En curso"
        //"UPDATE viaje SET asientos_disponibles=? WHERE id_viaje=?"
        console.log(viaje[0].viaje)
        await pool.query("UPDATE chofer_viaje SET estado=? WHERE id_viajechofer=?",[estado_enCurso,id])
        await pool.query("UPDATE usuario_viaje SET estado=? WHERE viaje=?",[estado_enCurso,viaje[0].viaje])
        res.json({
            value: viaje,
            result: true,
            message: "Se ha comenzado el viaje exitosamente!"
        });
    }else{
        if(viaje[0].estado == "En curso"){
            res.json({
                value: viaje,
                result: false,
                message: "No se puede comenzar el viaje ya que esta en curso!"
            });
        }
    }
})

module.exports = router;