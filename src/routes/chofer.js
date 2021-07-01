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
const helpers = require('../lib/helpers');
const jsonUtils = require('../lib/json_utils')

router.get('/arealizar', hasPermission, (req, res) => {
    const key = req.user.img;
    res.render('chofer/arealizar', { key });
})

router.get('/yaRealizados', hasPermission, (req, res) => {
    const key = req.user.img;
    res.render('chofer/yaRealizados', { key });
})


router.get("/arealizarJSON", hasPermission, isChofer, async (req, res) => {
    const usuario = req.user
    id_usuario = usuario.id_usuario
    en_curso = "En curso"
    pendiente = "Pendiente"
    const aux = await pool.query(
        "SELECT * FROM chofer_viaje WHERE chofer=? AND estado=? or estado=?", [id_usuario, en_curso, pendiente]
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

router.get("/yaRealizadosJSON", hasPermission, isChofer, async (req, res) => {
    const usuario = req.user
    id_usuario = usuario.id_usuario
    cancelado = "Cancelado"
    finalizado = "Concretado"
    const aux = await pool.query(
        "SELECT * FROM chofer_viaje WHERE chofer=? AND estado=? or estado=?", [id_usuario, cancelado, finalizado]
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

    const choferViaje = await pool.query('SELECT * FROM chofer_viaje WHERE id_viajechofer=?', [id]);
    const viaje1 = await pool.query('SELECT * FROM viaje WHERE id_viaje=?', [choferViaje[0].viaje])

    if (choferViaje[0].estado != 'Pendiente') {
        req.flash('errorVentaEstado', ' ');
        return res.redirect('/chofer/arealizar')
    } else {
        if (viaje1[0].asientos_disponibles == 0) {
            req.flash('errorVentaPasajes', ' ');
            return res.redirect('/chofer/arealizar')
        } else {
            const insumos = await pool.query('SELECT i.id_insumo, i.nombre, vi.cantidad, i.precio FROM viaje_insumos vi INNER JOIN insumo i ON (vi.insumo = i.id_insumo) WHERE vi.viaje=?', [choferViaje[0].viaje]);

            var viaje = await pool.query("SELECT v.id_viaje, v.fecha_salida, v.hora_salida, v.fecha_llegada, v.hora_llegada, c.tipo_asiento, v.precio, l1.nombre AS origen, l2.nombre AS destino FROM viaje v INNER JOIN ruta r ON(v.ruta = r.id_ruta)"+
                                            "INNER JOIN combi c ON(v.combi = c.id_combi)"+
                                            "INNER JOIN lugar l1 ON(r.origen = l1.id_lugar)"+
                                            "INNER JOIN lugar l2 ON(r.destino = l2.id_lugar)"+
                                        "WHERE id_viaje=?", [choferViaje[0].viaje]);
            viaje[0].hora_salida = viaje[0].hora_salida.slice(0, 5);
            viaje[0].hora_llegada = viaje[0].hora_llegada.slice(0, 5);

            viaje[0].diaSalida = dateFormat(viaje[0].fecha_salida, "dddd dd");
            viaje[0].hora_salida = viaje[0].hora_salida+" HS"
            viaje[0].mesSalida = dateFormat(viaje[0].fecha_salida, "mmm. yyyy");

            viaje[0].diaLlegada = dateFormat(viaje[0].fecha_llegada, "dddd dd");
            viaje[0].hora_llegada = viaje[0].hora_llegada+" HS"
            viaje[0].mesLlegada = dateFormat(viaje[0].salida, "mmm. yyyy");

            return res.render('chofer/venta', {id_viaje: choferViaje[0].viaje, 
                insumos, 
                quantity: viaje1[0].asientos_disponibles, 
                subtotal: viaje1[0].precio, 
                "insumosTest": jsonUtils.encodeJSON(insumos),
                viaje: viaje[0]
            });
        }
    }
})

router.post('/venta/email', 
    body("emailValue").isEmail().withMessage("Formato de email invalido!"),
    hasPermission, isChofer, async (req, res) => {
        const { emailValue } = req.body;

        var isRegistered = false;
        var resultAccount;
        var isPositive = false;
        var id_usuario;
        const result = validationResult(req);
        const errors = result.errors;
        if (errors.length == 0) {
            resultAccount = await pool.query("SELECT u.id_usuario AS id ,u.name, u.lastname, u.birthdate FROM usuario u INNER JOIN autoridad a ON (u.id_usuario=a.id_usuario) WHERE a.rol=? AND u.email=?", [ROLE.COMUN, emailValue]);
            if (resultAccount.length > 0) {
                isRegistered = true;
                id_usuario = resultAccount[0].id;
                const resultForm = await pool.query('SELECT * FROM formulario_covid WHERE usuario=? AND estado=?', [resultAccount[0].id, 'POSITIVO']);
                if (resultForm.length > 0) {
                    var plusFifteenDays;
                    for (let i = 0; i < resultForm.length; i++) {
                        if (resultForm[i].estado = 'POSITIVO') {
                            plusFifteenDays = moment(resultForm[0].fecha).add(15, 'd').format('YYYY-MM-DD');
                            if (moment().isBefore(plusFifteenDays)) {
                                isPositive = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
        res.send({errors, isRegistered, isPositive, resultAccount, id_usuario});
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
    async (req, res) => {
        const { name, lastname, username, email, birthdate } = req.body;

        const result = validationResult(req);
        const errors = result.errors;
        var id_usuario;

        if (errors.length == 0) {
            const randomPassword = helpers.getRandomString(8);
            const encryptedPassword = await helpers.encryptPassword(randomPassword);

            const userInfo = {
                name,
                lastname,
                birthdate,
                email,
                username,
                password: encryptedPassword,
                plan: 'basico',
                img: 'ba8b5b6ca080b6038085e89fe076c4ed'
            }

            const row = await pool.query('INSERT INTO usuario SET ?', [userInfo]);
            const autoridad = {
                rol: ROLE.COMUN,
                id_usuario: row.insertId
            };
            await pool.query('INSERT INTO autoridad SET ?', [autoridad]);

            const mailSubject = "Cuenta creada";
            const content = `
                <img src="https://i.ibb.co/V3gnkDd/logoTest.png" width="273" height="82.6">
                <div style="text-align: center;">
                    <img src="https://cdn.icon-icons.com/icons2/1732/PNG/512/iconfinder-securityprotectlockshield20-4021466_113124.png" width="150" height="150">
                    <p style="font-size: 1.1rem">Hola!</p>
                    <p style="font-size: 1.1rem">Aqui estan los datos de la cuenta creada automaticamente por el chofer:</p>
                    <h1 style="margin: .5rem auto; font-size: 2rem; font-weight: 800;">Nombre de usuario: ${username}</h1>
                    <h1 style="margin: .5rem auto; font-size: 2rem; font-weight: 800;">Contraseña: ${randomPassword}</h1>
                    <p style="font-size: 1.1rem">Todo lo que tienes que hacer es iniciar sesion con los datos de arriba, y luego podras cambiar la contraseña sin problemas en tu perfil.</p>
                    <div style="text-align: center; background-color: #edf1f6; padding: .8rem 0">
                        <span style="display: block; font-size: .9rem;">¿No fuiste tu? Si no fuiste tu ignora este mensaje.</span>
                        <span style="display: block; margin-top: .3rem; font-size: .9rem;">&copy; Equipo Combi-19. Todos los derechos reservados.</span>
                    </div>
                </div>
            `;
            id_usuario = row.insertId;
            helpers.sendMail(content, mailSubject, email);
        }

        res.send({errors, id_usuario});
});

router.post('/venta/formulario',
    body('temperatura').notEmpty().withMessage('Este campo no puede estar vacio!'),
    body('fiebre').notEmpty().withMessage('Debes elegir "Si" o "No"!'),
    body('gusto').notEmpty().withMessage('Debes elegir "Si" o "No"!'),
    body('garganta').notEmpty().withMessage('Debes elegir "Si" o "No"!'),
    body('respiracion').notEmpty().withMessage('Debes elegir "Si" o "No"!'),
    hasPermission, isChofer, async (req, res) => {
        const { temperatura, fiebre, gusto, garganta, respiracion, email } = req.body;

        const result = validationResult(req);
        const errors = result.errors;
        var esPositivo = false;
        if (errors.length == 0) {
            if (temperatura > 38) {
                esPositivo = true;
            } else {
                var cantSintomas = 0;
                if (fiebre == 'Si') {
                    cantSintomas += 1;
                }
                if (gusto == 'Si') {
                    cantSintomas += 1;
                }
                if (garganta == 'Si') {
                    cantSintomas += 1;
                }
                if (respiracion == 'Si') {
                    cantSintomas += 1;
                }
                if (cantSintomas >= 2) {
                    esPositivo = true;
                }
            }

            const result = await pool.query('SELECT * FROM usuario WHERE email=?', [email]);

            const formulario = {
                usuario: result[0].id_usuario,
                temperatura,
                fiebre,
                gusto,
                garganta,
                respiracion,
                estado: (esPositivo) ? 'POSITIVO' : 'NEGATIVO',
                fecha: moment().format('YYYY-MM-DD'),
                hora: moment().format("HH:mm")
            }

            await pool.query('INSERT INTO formulario_covid SET ?', [formulario]);
        }

        res.send({errors, esPositivo});
});

router.post("/comenzar/", hasPermission, isChofer, async (req, res) => {
    const { id } = req.body;
    viaje = await pool.query("SELECT viaje,estado FROM chofer_viaje WHERE id_viajechofer=?", [id])
    fecha_de_salida = await pool.query("SELECT fecha_salida FROM viaje WHERE id_viaje=?", [viaje[0].viaje])
    fecha_de_salida = dateFormat(fecha_de_salida[0].fecha_salida, "yyyy-mm-dd");
    const hoy = dateFormat("yyyy-mm-dd")
    if (viaje[0].estado == "Pendiente") {
        if (fecha_de_salida !== hoy) {
            res.json({
                value: viaje,
                result: false,
                message: "El viaje no puede comenzarse hasta que sea la fecha de salida"
            })
        } else {
            estado_enCurso = "En curso"
            await pool.query("UPDATE chofer_viaje SET estado=? WHERE id_viajechofer=?", [estado_enCurso, id])
            usuarios_con_viaje = await pool.query("SELECT * FROM usuario_viaje  WHERE viaje=?", [viaje[0].viaje])
            for (var i = 0; i < usuarios_con_viaje.length; i++) {
                if (usuarios_con_viaje[i].estado.toUpperCase() == "PENDIENTE") {
                    await pool.query("UPDATE usuario_viaje SET estado=? WHERE id_usuarioviaje=?", [estado_enCurso, usuarios_con_viaje[i].id_usuarioviaje])
                }
            }
            res.json({
                value: viaje,
                result: true,
                message: "Se ha comenzado el viaje exitosamente!"
            })
        };
    } else {
        if (viaje[0].estado == "En curso") {
            res.json({
                value: viaje,
                result: false,
                message: "No se puede comenzar el viaje ya que esta en curso!"
            });
        }
    }
})

router.post("/finalizar/", hasPermission, isChofer, async (req, res) => {
    const { id } = req.body;
    viaje = await pool.query("SELECT viaje,estado FROM chofer_viaje WHERE id_viajechofer=?", [id])
    if (viaje[0].estado == "En curso") {
        estado_finalizado = "Concretado"
        await pool.query("UPDATE chofer_viaje SET estado=? WHERE id_viajechofer=?", [estado_finalizado, id])
        usuarios_con_viaje = await pool.query("SELECT * FROM usuario_viaje  WHERE viaje=?", [viaje[0].viaje])
        for (var i = 0; i < usuarios_con_viaje.length; i++) {
            if (usuarios_con_viaje[i].estado.toUpperCase() == "EN CURSO") {
                await pool.query("UPDATE usuario_viaje SET estado=? WHERE id_usuarioviaje=?", [estado_finalizado, usuarios_con_viaje[i].id_usuarioviaje])
            }
        }
        res.json({
            value: viaje,
            result: true,
            message: "Se ha finalizado el viaje exitosamente!"
        });
    } else {
            res.json({
                value: viaje,
                result: false,
                message: "No se puede finalizar el viaje ya que esta en estado pendiente!"
            });
        
    }
})


router.post("/cancelar/", hasPermission, isChofer, async (req, res) => {
    const { id } = req.body;
    viaje = await pool.query("SELECT viaje,estado FROM chofer_viaje WHERE id_viajechofer=?", [id])
    
    if (viaje[0].estado == "En curso") {
        res.json({
            value: viaje,
            result: false,
            message: "No se puede cancelar el viaje ya que se encuentra en curso!"
        });
    }
    else {
        estado_cancelado = "Cancelado"
        await pool.query("UPDATE chofer_viaje SET estado=? WHERE id_viajechofer=?", [estado_cancelado, id])

        viaje_info = await pool.query("SELECT * FROM viaje  WHERE id_viaje=?", [viaje[0].viaje])
        const rutasViaje = await pool.query("SELECT r.origen AS origenid ,r.destino AS destinoid,r.id_ruta AS id_ruta,l.nombre AS nombreorigen,l2.nombre AS nombredestino FROM ruta r INNER JOIN lugar l ON (r.origen=l.id_lugar) INNER JOIN lugar l2 ON (r.destino=l2.id_lugar) WHERE id_ruta=?", [viaje_info[0].ruta]);
        fecha_salida=dateFormat(viaje_info[0].fecha_salida, "yyyy-mm-dd");

        //HAY Q TERMINAR DE MANDAR EL MAILA  TODOS LOS USUARIOS CON LA CANBCELANCION DEL VIAJE
        //<img src="https://i.ibb.co/V3gnkDd/logoTest.png" width="273" height="82.6">
        const mailSubject = "Cancelacion de viaje";
        
        const content = `
            <div style="text-align: center;">
                <img src="https://cdn.icon-icons.com/icons2/1732/PNG/512/iconfinder-securityprotectlockshield20-4021466_113124.png" width="150" height="150">
                <p style="font-size: 1.1rem">Hola!</p>
                <p style="font-size: 1.1rem">Disculpe las molestias pero el viaje con el origen ${rutasViaje[0].nombreorigen}, destino ${rutasViaje[0].nombredestino} y fecha de sailda ${fecha_salida} ha sido cancelado y se le devolvio el 100% del dinero.</p>
                <div style="text-align: center; background-color: #edf1f6; padding: .8rem 0">
                    <span style="display: block; margin-top: .3rem; font-size: .9rem;">&copy; Equipo Combi-19. Todos los derechos reservados.</span>
                </div>
            </div>
        `

        usuarios_con_viaje = await pool.query("SELECT * FROM usuario_viaje  WHERE viaje=?", [viaje[0].viaje])
        console.log("addsasadads",usuarios_con_viaje)
        for (var i = 0; i < usuarios_con_viaje.length; i++) {
            if (usuarios_con_viaje[i].estado.toUpperCase() == "PENDIENTE") {
                await pool.query("UPDATE usuario_viaje SET estado=? WHERE id_usuarioviaje=?", [estado_cancelado, usuarios_con_viaje[i].id_usuarioviaje])
                usuario=await pool.query("SELECT usuario FROM usuario_viaje  WHERE id_usuarioviaje=?", [usuarios_con_viaje[i].id_usuarioviaje])
                email_usuario=await pool.query("SELECT email FROM usuario  WHERE id_usuario=?", [usuario[0].usuario])
                email=email_usuario[0].email
                console.log("holiwis",email,mailSubject)
                helpers.sendMail(content, mailSubject, email)
                    .then(result => res.status(200).send(true))
                    .catch(error => console.log(error.message))
            }
        }
        res.json({
            value: viaje,
            result: true,
            message: "El viaje se cancelo exitosamente!"
        });

    }
})

module.exports = router;