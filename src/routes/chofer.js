// Constantes

const express = require('express');
const router = express.Router();
const { hasPermission, isChofer } = require("../lib/auth");
const moment = require('moment');
var dateFormat = require("dateformat");
const app = express()
const { body, check, validationResult } = require('express-validator');
const pool = require('../database');
const { ROLE } = require('../lib/roles');

router.get('/arealizar', hasPermission, (req, res) => {
    const key = req.user.img;
    res.render('chofer/arealizar', { key });
})


router.get("/arealizarJSON", hasPermission, isChofer, async (req, res) => {
    const usuario = req.user
    id_usuario = usuario.id_usuario
    en_curso="En curso"
    pendiente="Pendiente"
    const aux = await pool.query(
        "SELECT * FROM chofer_viaje WHERE chofer=? AND estado=? or estado=?", [id_usuario,en_curso,pendiente]
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

router.get('/venta/:id', hasPermission, isChofer, async (req, res) => {
    const { id } = req.params;
    res.render('chofer/venta');
})

router.post('/venta/email', 
    body("emailValue").isEmail().withMessage("Formato de email invalido!"),
    hasPermission, isChofer, async (req, res) => {
        const { emailValue } = req.body;

        var isRegistered = false;
        var resultAccount;
        const result = validationResult(req);
        const errors = result.errors;
        if (errors.length == 0) {
            resultAccount = await pool.query("SELECT u.name, u.lastname, u.birthdate FROM usuario u INNER JOIN autoridad a ON (u.id_usuario=a.id_usuario) WHERE a.rol=? AND u.email=?", [ROLE.COMUN, emailValue]);
            if (resultAccount.length > 0) {
                isRegistered = true;
            }
        }
        res.send({errors, isRegistered, resultAccount});
});

router.post('/venta/username', hasPermission, isChofer, async (req, res) => {
    const { usernameValue } = req.body;
    const usernameResult = await pool.query('SELECT * FROM usuario WHERE username=?', [usernameValue]);
    if (usernameResult.length > 0) {
        res.send(false);
    } else {
        res.send(true);
    }
});

router.post('/venta/birthdate', hasPermission, isChofer, (req, res) => {
    const { birthdateValue } = req.body;

    let userBirthdate = new Date(birthdateValue);
    let d = new Date();
    let year = d.getFullYear();
    let month = d.getMonth();
    let day = d.getDate();
    let cA = new Date(year - 18, month, day);
    if (userBirthdate > cA) {
        res.send(false);
    } else {
        res.send(true);
    }
});

router.post('/venta/passenger', 
    body('name').notEmpty().withMessage('Este campo no puede estar vacio!'),
    body('lastname').notEmpty().withMessage('Este campo no puede estar vacio!'),
    body('username').notEmpty().withMessage('Este campo no puede estar vacio!'),
    body('username').custom(async (value) => {
        if (value != '') {
            const result = await pool.query('SELECT * FROM usuario WHERE username=?', [value]);
            if (result.length > 0) {
                throw new Error('El nombre de usuario ya se encuentra en uso!');
            };
        };
    }),
    body('birthdate').notEmpty().withMessage('Este campo no puede estar vacio!'),
    body('birthdate').custom(async (value) => {
        if (value != '') {
            let userBirthdate = new Date(value);
            let d = new Date();
            let year = d.getFullYear();
            let month = d.getMonth();
            let day = d.getDate();
            let cA = new Date(year - 18, month, day);
            if (userBirthdate > cA) {
                throw new Error('Debe ser mayor de 18 años!');
            }
        };
    }),
    (req, res) => {
        const { name, lastname, username, birthdate } = req.body;

        const result = validationResult(req);
        const errors = result.errors;

        res.send(errors);
});

router.post('/venta/formulario',
    body('temperatura').notEmpty().withMessage('Este campo no puede estar vacio!'),
    body('fiebre').notEmpty().withMessage('Debes elegir "Si" o "No"!'),
    body('gusto').notEmpty().withMessage('Debes elegir "Si" o "No"!'),
    body('garganta').notEmpty().withMessage('Debes elegir "Si" o "No"!'),
    body('respiracion').notEmpty().withMessage('Debes elegir "Si" o "No"!'),
    hasPermission, isChofer, (req, res) => {
        
        const result = validationResult(req);
        const errors = result.errors;

        res.send(errors);
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