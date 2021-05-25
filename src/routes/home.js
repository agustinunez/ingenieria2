const express = require('express');
const router = express.Router();
const pool = require("../database");
const { body, validationResult } = require('express-validator');
var dateFormat = require("dateformat");
const moment = require('moment');
const helpers = require('../lib/helpers');

dateFormat.i18n = {
    dayNames: [
        "Dom",
        "Lun",
        "Mar",
        "Mie",
        "Jue",
        "Vie",
        "Sab",
        "Domingo",
        "Lunes",
        "Martes",
        "Miercoles",
        "Jueves",
        "Viernes",
        "Sabado"
    ],
    monthNames: [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Deciembre",
      ]
}

router.get(['','/', '/home'], async(req, res) => {
    const lugares = await pool.query("SELECT * FROM lugar ORDER BY nombre");
    res.render('home', { lugares });
});

router.post('/lugarValidation', async(req, res) => {
    const { lugarValue } = req.body;
    const result = await pool.query("SELECT * FROM lugar WHERE nombre=?", lugarValue);
    if (result.length > 0) {
        res.json(true);
    } else {
        res.json(false);
    }
})

router.post('/viajes', async(req, res) => {
    var { origin, destination, departureDate, amount } = req.body;
    let viajes;
    if (departureDate == moment().format('YYYY-MM-DD')) {
        const actualTime = moment().format("HH:mm:ss");
        viajes = await pool.query("SELECT v.fecha_salida, v.hora_salida, v.fecha_llegada, v.hora_llegada, c.tipo_asiento, v.precio FROM viaje v INNER JOIN ruta r ON(v.ruta = r.id_ruta)"+
                                                 "INNER JOIN combi c ON(v.combi = c.id_combi)"+
                                                 "INNER JOIN lugar l1 ON(r.origen = l1.id_lugar)"+
                                                 "INNER JOIN lugar l2 ON(r.destino = l2.id_lugar)"+
                                    "WHERE l1.nombre=? AND l2.nombre=? AND v.fecha_salida=? AND v.hora_salida>=? AND v.fecha_publicacion <= curdate() AND v.asientos_disponibles>=?"+
                                    "ORDER BY v.hora_salida", [origin, destination, departureDate, actualTime, amount]);
    } else {
        viajes = await pool.query("SELECT v.fecha_salida, v.hora_salida, v.fecha_llegada, v.hora_llegada, c.tipo_asiento, v.precio FROM viaje v INNER JOIN ruta r ON(v.ruta = r.id_ruta)"+
                                                "INNER JOIN combi c ON(v.combi = c.id_combi)"+
                                                "INNER JOIN lugar l1 ON(r.origen = l1.id_lugar)"+
                                                "INNER JOIN lugar l2 ON(r.destino = l2.id_lugar)"+
                                    "WHERE l1.nombre=? AND l2.nombre=? AND v.fecha_salida=? AND v.fecha_publicacion <= curdate() AND v.asientos_disponibles>=?"+
                                    "ORDER BY v.hora_salida", [origin, destination, departureDate, amount]);
    }

    for (let i = 0; i < viajes.length; i++) {
        viajes[i].hora_salida = viajes[i].hora_salida.slice(0, 5);
        viajes[i].hora_llegada = viajes[i].hora_llegada.slice(0, 5);
        viajes[i].duracion = helpers.duracion(viajes[i].hora_salida, viajes[i].hora_llegada);

        viajes[i].diaSalida = dateFormat(viajes[i].fecha_salida, "dddd dd");
        viajes[i].hora_salida = viajes[i].hora_salida+" HS"
        viajes[i].mesSalida = dateFormat(viajes[i].fecha_salida, "mmm. yyyy");

        viajes[i].diaLlegada = dateFormat(viajes[i].fecha_llegada, "dddd dd");
        viajes[i].hora_llegada = viajes[i].hora_llegada+" HS"
        viajes[i].mesLlegada = dateFormat(viajes[i].salida, "mmm. yyyy");
    }
    res.render('user/viajes', { viajes, origin, destination });
})

router.post('/viajesValidacion',
    body("origin").notEmpty().withMessage("Este campo no puede estar vacio!"),
    body('origin').custom(async (value) => {
        if (value != '') {
            const result = await pool.query("SELECT * FROM lugar WHERE nombre=?", [value]);
            if (result.length == 0) {
                throw new Error("Lo siento, no existe el origen en el sistema!");
            }
        }
    }),
    body("destination").notEmpty().withMessage("Este campo no puede estar vacio!"),
    body('destination').custom(async (value) => {
        if (value != '') {
            const result = await pool.query("SELECT * FROM lugar WHERE nombre=?", [value]);
            if (result.length == 0) {
                throw new Error("Lo siento, no existe el destino en el sistema!");
            }
        }
    }),
    body("departureDate").notEmpty().withMessage("Este campo no puede estar vacio!"),
    body("departureDate").custom(async(value) => {
        if (value != '') {
           if (value < moment().format('YYYY-MM-DD')) {
            throw new Error("Lo siento, la fecha debe ser mayor o igual a la actual!");
            } 
        }
    }),
    body("amount").notEmpty().withMessage("Este campo no puede estar vacio!"),
    (req, res) => {
    const result = validationResult(req);
    const errors = result.errors;

    res.send(errors);
})

// Aca exporto el enrutador

module.exports = router;