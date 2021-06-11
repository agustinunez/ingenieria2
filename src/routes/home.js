const express = require('express');
const router = express.Router();
const pool = require("../database");
const { body, validationResult } = require('express-validator');
var dateFormat = require("dateformat");
const moment = require('moment');
const helpers = require('../lib/helpers');
const jsonUtils = require('../lib/json_utils')

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
    if (req.user){
        var key = req.user.img;
    }
    
    const lugares = await pool.query("SELECT * FROM lugar ORDER BY nombre");
    res.render('home', { lugares, key });
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
    origin = origin.toUpperCase();
    destination = destination.toUpperCase();
    let viajes;
    const user = req.user;
    const key = (req.user) ? req.user.img : '';
    
    
    if (departureDate == moment().format('YYYY-MM-DD')) {
        const actualTime = moment().format("HH:mm:ss");
        //En caso que la fecha de salida sea igual a la actual, se obtienen los viajes que tengan hora de salida >= a la hora actual.
        viajes = await pool.query("SELECT v.id_viaje, v.fecha_salida, v.hora_salida, v.fecha_llegada, v.hora_llegada, c.tipo_asiento, v.precio FROM viaje v INNER JOIN ruta r ON(v.ruta = r.id_ruta)"+
                                                 "INNER JOIN combi c ON(v.combi = c.id_combi)"+
                                                 "INNER JOIN lugar l1 ON(r.origen = l1.id_lugar)"+
                                                 "INNER JOIN lugar l2 ON(r.destino = l2.id_lugar)"+
                                    "WHERE l1.nombre=? AND l2.nombre=? AND v.fecha_salida=? AND v.hora_salida>=? AND v.fecha_publicacion <= curdate() AND v.asientos_disponibles>=?"+
                                    "ORDER BY v.hora_salida", [origin, destination, departureDate, actualTime, amount]);
    } else {
        viajes = await pool.query("SELECT v.id_viaje, v.fecha_salida, v.hora_salida, v.fecha_llegada, v.hora_llegada, c.tipo_asiento, v.precio FROM viaje v INNER JOIN ruta r ON(v.ruta = r.id_ruta)"+
                                                "INNER JOIN combi c ON(v.combi = c.id_combi)"+
                                                "INNER JOIN lugar l1 ON(r.origen = l1.id_lugar)"+
                                                "INNER JOIN lugar l2 ON(r.destino = l2.id_lugar)"+
                                    "WHERE l1.nombre=? AND l2.nombre=? AND v.fecha_salida=? AND v.fecha_publicacion <= curdate() AND v.asientos_disponibles>=?"+
                                    "ORDER BY v.hora_salida", [origin, destination, departureDate, amount]);
    }

    if (user && (user.plan == 'gold')) {
        for (let i = 0; i < viajes.length; i++) {
            viajes[i].precio = +viajes[i].precio - (+viajes[i].precio * .10);
            viajes[i].hora_salida = viajes[i].hora_salida.slice(0, 5);
            viajes[i].hora_llegada = viajes[i].hora_llegada.slice(0, 5);
            viajes[i].duracion = helpers.duracion(viajes[i].hora_salida, viajes[i].hora_llegada);
    
            viajes[i].diaSalida = dateFormat(viajes[i].fecha_salida, "dddd dd");
            viajes[i].hora_salida = viajes[i].hora_salida+" HS"
            viajes[i].mesSalida = dateFormat(viajes[i].fecha_salida, "mmm. yyyy");
    
            viajes[i].diaLlegada = dateFormat(viajes[i].fecha_llegada, "dddd dd");
            viajes[i].hora_llegada = viajes[i].hora_llegada+" HS"
            viajes[i].mesLlegada = dateFormat(viajes[i].salida, "mmm. yyyy");
            viajes[i].amount = amount;
        }
    } else {
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
            viajes[i].amount = amount;
        }
    }
    res.render('user/viajes', { viajes, origin, destination, key });
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

router.get('/compra', async (req, res) => {
    const { id, quantity } = req.query
    if (!req.user) {
        req.flash('errorCompra', ' ')
        return res.redirect('/home')
    }
    var valid = true;
    if (!id || !quantity) {
        valid = false;
    }
    const user = req.user;
    const viaje = await pool.query("SELECT v.id_viaje, v.fecha_salida, v.hora_salida, v.fecha_llegada, v.hora_llegada, c.tipo_asiento, v.precio, l1.nombre AS origen, l2.nombre AS destino FROM viaje v INNER JOIN ruta r ON(v.ruta = r.id_ruta)"+
                                                "INNER JOIN combi c ON(v.combi = c.id_combi)"+
                                                "INNER JOIN lugar l1 ON(r.origen = l1.id_lugar)"+
                                                "INNER JOIN lugar l2 ON(r.destino = l2.id_lugar)"+
                                    "WHERE id_viaje=?"+
                                    "ORDER BY v.hora_salida", [id]);
    if (user && (user.plan == 'gold')) {
        viaje[0].precio = +viaje[0].precio - (+viaje[0].precio * .10);
    }
    viaje[0].hora_salida = viaje[0].hora_salida.slice(0, 5);
    viaje[0].hora_llegada = viaje[0].hora_llegada.slice(0, 5);
    viaje[0].duracion = helpers.duracion(viaje[0].hora_salida, viaje[0].hora_llegada);

    viaje[0].diaSalida = dateFormat(viaje[0].fecha_salida, "dddd dd");
    viaje[0].hora_salida = viaje[0].hora_salida+" HS"
    viaje[0].mesSalida = dateFormat(viaje[0].fecha_salida, "mmm. yyyy");

    viaje[0].diaLlegada = dateFormat(viaje[0].fecha_llegada, "dddd dd");
    viaje[0].hora_llegada = viaje[0].hora_llegada+" HS"
    viaje[0].mesLlegada = dateFormat(viaje[0].salida, "mmm. yyyy");
    viaje[0].quantity = quantity;
    viaje[0].subtotal = (+viaje[0].precio * +quantity).toFixed(2);
    res.render('user/viajeCompra', { viaje: viaje[0], valid, key: req.user.img });
})

router.post('/confirmPrecio', async(req, res) => {
    const { id_viaje, quantity, subtotal } = req.body;
    const insumos = await pool.query('SELECT i.id_insumo, i.nombre, vi.cantidad, i.precio FROM viaje_insumos vi INNER JOIN insumo i ON (vi.insumo = i.id_insumo) WHERE vi.viaje=?', [id_viaje]);
    res.render('user/viajeInsumos', { key: req.user.img, id_viaje, quantity, subtotal, insumos, "insumosTest": jsonUtils.encodeJSON(insumos) });
})

router.post('/confirmInsumos', async (req, res) => {
    var { id_viaje, quantity, subtotal, insumos } = req.body;
    var insumosListar = JSON.parse(decodeURI(insumos))
    var viaje = await pool.query("SELECT v.id_viaje, v.fecha_salida, v.hora_salida, v.fecha_llegada, v.hora_llegada, c.tipo_asiento, v.precio, l1.nombre AS origen, l2.nombre AS destino FROM viaje v INNER JOIN ruta r ON(v.ruta = r.id_ruta)"+
                                            "INNER JOIN combi c ON(v.combi = c.id_combi)"+
                                            "INNER JOIN lugar l1 ON(r.origen = l1.id_lugar)"+
                                            "INNER JOIN lugar l2 ON(r.destino = l2.id_lugar)"+
                                        "WHERE id_viaje=?", [id_viaje]);
    viaje[0].hora_salida = viaje[0].hora_salida.slice(0, 5);
    viaje[0].hora_llegada = viaje[0].hora_llegada.slice(0, 5);

    viaje[0].diaSalida = dateFormat(viaje[0].fecha_salida, "dddd dd");
    viaje[0].hora_salida = viaje[0].hora_salida+" HS"
    viaje[0].mesSalida = dateFormat(viaje[0].fecha_salida, "mmm. yyyy");

    viaje[0].diaLlegada = dateFormat(viaje[0].fecha_llegada, "dddd dd");
    viaje[0].hora_llegada = viaje[0].hora_llegada+" HS"
    viaje[0].mesLlegada = dateFormat(viaje[0].salida, "mmm. yyyy");
    for (let i = 0; i < insumosListar.length; i++) {
        insumosListar[i].indice = i+ +1;
    }
    res.render('user/viajeResumen', { key: req.user.img, id_viaje, quantity, subtotal, insumos, insumosListar, viaje: viaje[0] })
})

router.post('/efectuarPago', async(req, res) => {
    var { idViajeGlobal, quantityGlobal, subtotalGlobal, insumos } = req.body;
    insumos = JSON.parse(decodeURI(insumos));
    const viaje = {
        usuario: req.user.id_usuario,
        viaje: idViajeGlobal,
        estado: 'PENDIENTE',
        cantidad: quantityGlobal,
        precio: subtotalGlobal
    }
    
    const resultUsuarioViaje = await pool.query('INSERT INTO usuario_viaje SET ?', [viaje]);
    console.log('RESULT: ', resultUsuarioViaje);
    insumos.forEach( async(insumo) => {
        let insumoViaje = {
            usuario_viaje: resultUsuarioViaje.insertId,
            insumo: insumo.id_insumo,
            cantidad: insumo.cantidad,
            total: insumo.total
        }
        await pool.query('INSERT INTO usuario_viaje_insumo SET ?', [insumoViaje]);

        var viajeInsumos = await pool.query('SELECT * FROM viaje_insumos WHERE viaje=? AND insumo=?', [idViajeGlobal, insumo.id_insumo]);
        let cantidad = +viajeInsumos[0].cantidad - +insumo.cantidad;
        await pool.query('UPDATE viaje_insumos SET cantidad=? WHERE id_viajeinsumos=?', [cantidad, viajeInsumos[0].id_viajeinsumos]);
    });

    var resultViaje = await pool.query('SELECT * FROM viaje WHERE id_viaje=?', [idViajeGlobal]);
    resultViaje[0].asientos_disponibles -= +quantityGlobal;
    await pool.query('UPDATE viaje SET asientos_disponibles=? WHERE id_viaje=?', [resultViaje[0].asientos_disponibles, idViajeGlobal]);
    res.send(true);
})

router.get('/isLoggedIn', (req, res) => {
    res.send({user: req.user});
})

// Aca exporto el enrutador

module.exports = router;