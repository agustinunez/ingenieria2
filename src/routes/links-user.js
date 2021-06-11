// ACA VA LO DE FACU
// Constantes
const express = require('express');
const router = express.Router();
const { hasPermission } = require('../lib/auth');
const pool = require('../database');
var dateFormat = require("dateformat");
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const jsonUtils = require('../lib/json_utils')

// ACA VA EL BUSCAR VIAJE DE LUCAS

router.get('/tickets', hasPermission, (req, res) => {
    const key = req.user.img;
    res.render('user/tickets', { key });
})



router.get("/ticketsJSON", hasPermission, async (req, res) => {
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
// Aca exporto el enrutador

router.delete("/tickets/devolver/", hasPermission, async (req, res) => {
    const { id } = req.body;
    const result = await pool.query("SELECT * FROM usuario_viaje WHERE id_usuarioviaje=?", [id]);
    if (result[0].estado.toUpperCase() == "PENDIENTE") {
        const resultInsumosAgregados = await pool.query('SELECT * FROM usuario_viaje_insumo WHERE usuario_viaje=?', [id]);
        resultInsumosAgregados.forEach( async(insumo) => {
            let resultViajeInsumos = await pool.query('SELECT * FROM viaje_insumos WHERE viaje=? AND insumo=?', [result[0].viaje, insumo.insumo]);
            let cantidad = +resultViajeInsumos[0].cantidad + +insumo.cantidad;
            await pool.query('UPDATE viaje_insumos SET cantidad=? WHERE id_viajeinsumos=?', [cantidad, resultViajeInsumos[0].id_viajeinsumos]);
            await pool.query("DELETE FROM usuario_viaje_insumo WHERE idusuario_viaje_insumo=?", [insumo.idusuario_viaje_insumo]);
        });

        const viaje = result[0].viaje
        let asientosDispoiblesAnterior = await pool.query("SELECT asientos_disponibles FROM viaje WHERE id_viaje=?", [viaje]);
        asientosDispoiblesAnterior = result[0].cantidad + asientosDispoiblesAnterior[0].asientos_disponibles
        const devolverCantidadViaje = await pool.query("UPDATE viaje SET asientos_disponibles=? WHERE id_viaje=?", [asientosDispoiblesAnterior, viaje]); 
        var fechas_de_salida = await pool.query("SELECT fecha_salida,hora_salida FROM viaje WHERE id_viaje=?", [result[0].viaje]);
        var now = dateFormat(moment(), "yyyy-mm-dd");
        var a = moment(fechas_de_salida[0].fecha_salida)
        var b = moment(now)
        const diferencia = a.diff(b, 'days')
        const estado = "CANCELADO"
        await pool.query("UPDATE usuario_viaje set estado=? WHERE id_usuarioviaje=?", [estado,id]);
        if (diferencia <= 2) {
            if (diferencia == 2) {
                hora_actual = moment().format('HH:mm:ss');
                hora_salida = fechas_de_salida[0].hora_salida
                if (hora_actual > hora_salida) {
                    res.json({
                        value: result[0].viaje,
                        result: true,
                        message: "Se ha devuelto el 50% del valor del pasaje exitosamente!"
                    });
                }else{
                    res.json({
                        value: result[0].viaje,
                        result: true,
                        message: "Se ha devuelto el 100% del valor del pasaje exitosamente!"
                    });
                }
            } else {
                res.json({
                    value: result[0].viaje,
                    result: true,
                    message: "Se ha devuelto el 50% del valor del pasaje exitosamente!"
                });
            }
        } else {
            res.json({
                value: result[0].viaje,
                result: true,
                message: "Se ha devuelto el 100% del valor del pasaje exitosamente!"
            })
        };
    } else {
        if (result[0].estado.toUpperCase() == "CONCRETADO") {
            res.json({
                result: false,
                message: "El viaje se encuentra finalizado!",
            });
        } else {
            res.json({
                result: false,
                message: "El viaje ya encuentra cancelado!",
            });
        }
    }
});

router.get('/detalles/:id', hasPermission, async (req, res) => {
    var { id } = req.params;
    const aux = await pool.query("SELECT * FROM usuario_viaje WHERE id_usuarioviaje=?", [id]);
    if ((aux[0].estado).toUpperCase() != "CONCRETADO") {
        req.flash("errorComentario", ' ')
        return res.redirect('/user/tickets')
    }
    const usuario = req.user
    usarname_activo = await pool.query("SELECT username FROM usuario WHERE id_usuario=?", [usuario.id_usuario]);
    usarname_activo = usarname_activo[0].username
    id_viaje = aux[0].viaje;
    const rutasViaje = await pool.query("SELECT r.origen AS origenid ,r.destino AS destinoid,r.id_ruta AS id_ruta,l.nombre AS nombreorigen,l2.nombre AS nombredestino FROM ruta r INNER JOIN lugar l ON (r.origen=l.id_lugar) INNER JOIN lugar l2 ON (r.destino=l2.id_lugar) ");
    const origen = rutasViaje[0].nombreorigen
    const destino = rutasViaje[0].nombredestino;
    const id_usuario = aux[0].usuario
    var comentarios = await pool.query("SELECT * FROM comentarios WHERE viaje=? ORDER BY id_comentarios DESC", [id_viaje]);
    //console.log(origen,destino)
    for (let index = 0; index < comentarios.length; index++) {
        nombre = await pool.query("SELECT username FROM usuario WHERE id_usuario=?", comentarios[index].usuario);
        comentarios[index].usuario = nombre[0].username
    }
    res.render('user/detalles', { origen, destino, comentarios, id_viaje, id_usuario, usarname_activo, key: usuario.img });
})

router.get('/insumos/:id', hasPermission, async(req, res) => {
    var { id } = req.params;
    const resultUsuarioViaje = await pool.query('SELECT * FROM usuario_viaje WHERE id_usuarioviaje=?', [id]);
    if (resultUsuarioViaje[0].estado == 'CANCELADO') {
        req.flash("errorVerInsumos", " ");
        return res.redirect('/user/tickets');
    }

    const insumos = await pool.query('SELECT i.id_insumo, i.nombre, vi.cantidad, i.precio FROM viaje_insumos vi INNER JOIN insumo i ON (vi.insumo = i.id_insumo) WHERE vi.viaje=?', [resultUsuarioViaje[0].viaje]);
    const subtotal = 0;
    var insumosListar = await pool.query('SELECT i.nombre, uvi.total FROM usuario_viaje_insumo uvi INNER JOIN insumo i ON (uvi.insumo = i.id_insumo) WHERE usuario_viaje=?', [id]);
    for (let i = 0; i < insumosListar.length; i++) {
        insumosListar[i].indice = i + +1;
    }
    res.render('user/viajeInsumos', { idUsuarioViaje: id, insumosListar, key: req.user.img, editar: true, subtotal, insumos, "insumosTest": jsonUtils.encodeJSON(insumos) });
})

router.post('/agregarInsumos', async(req, res) => {
    var { idGlobal, subtotal, insumos } = req.body;
    insumos = JSON.parse(decodeURI(insumos));
    const resultUsuarioViaje = await pool.query('SELECT * FROM usuario_viaje WHERE id_usuarioviaje=?', [idGlobal]);
    subtotal = +subtotal + +resultUsuarioViaje[0].precio;
    await pool.query('UPDATE usuario_viaje SET precio=? wHERE id_usuarioviaje=?', [subtotal, idGlobal]);

    insumos.forEach( async(insumo) => {
        let result = await pool.query('SELECT * FROM usuario_viaje_insumo WHERE usuario_viaje=? AND insumo=?', [idGlobal, insumo.id_insumo]);
        if (result.length > 0) {
            let cantidad = +result[0].cantidad + +insumo.cantidad;
            let total = +result[0].total + +insumo.total;
            await pool.query('UPDATE usuario_viaje_insumo SET cantidad=?, total=? WHERE idusuario_viaje_insumo=?', [cantidad, total, result[0].idusuario_viaje_insumo]);
        } else {
            let insumoViaje = {
                usuario_viaje: idGlobal,
                insumo: insumo.id_insumo,
                cantidad: insumo.cantidad,
                total: insumo.total 
            }
            await pool.query('INSERT INTO usuario_viaje_insumo SET ?', [insumoViaje]);
        }

        var viajeInsumos = await pool.query('SELECT * FROM viaje_insumos WHERE viaje=? AND insumo=?', [resultUsuarioViaje[0].viaje, insumo.id_insumo]);
        cantidad = +viajeInsumos[0].cantidad - +insumo.cantidad;
        await pool.query('UPDATE viaje_insumos SET cantidad=? WHERE id_viajeinsumos=?', [cantidad, viajeInsumos[0].id_viajeinsumos]);
    });
})


router.post('/comentario',
    body('comentario').notEmpty().withMessage("El comentario no puede estar vacio!"),
    body('comentario').custom(async (value) => {
        if (value != "" && value.length > 1000) {
            throw new Error('El comentario es demaciado extenso!');
        }
    }),
    hasPermission, async (req, res) => {
        const { comentario, id_usuario, id_viaje, } = req.body;
        const result = validationResult(req);
        const errors = result.errors;
        if (result.isEmpty()) {
            var nombre = await pool.query("SELECT username FROM usuario WHERE id_usuario=?", id_usuario);
            nombre = nombre[0].username
            const comentario_agregar = {
                usuario: id_usuario,
                viaje: id_viaje,
                comentario: comentario
            };
            await pool.query('INSERT INTO comentarios SET ?', [comentario_agregar]);
        }
        res.send({ errors, nombre })
    }
)

router.delete("/eliminar", hasPermission, async (req, res) => {
    const { id } = req.body;
    await pool.query("DELETE FROM comentarios WHERE id_comentarios=?", [id]);
    res.json({
        result: true,
        message: "El comentario se ha eliminado existosamente!",
    });
});

router.post('/agarrar_comentario', hasPermission, async (req, res) => {
    const { id } = req.body;
    var result = await pool.query("SELECT * FROM comentarios WHERE id_comentarios=?", [id]);

    res.send({ comentario: result[0].comentario, id_comentario: result[0].id_comentarios })
})


router.post('/confirmar_edicion', body('cometarioEditar').notEmpty().withMessage("El comentario no puede estar vacio!"),
    body('cometarioEditar').custom(async (value) => {
        if (value != "" && value.length > 1000) {
            throw new Error('El comentario es demaciado extenso!');
        }
    }), hasPermission, async (req, res) => {
        const { id, cometarioEditar } = req.body;
        const result = validationResult(req);
        const errors = result.errors;
        const comentario = await pool.query("SELECT * FROM comentarios WHERE id_comentarios", [id]);
        if (result.isEmpty()) {
            if (comentario[0].comentario != cometarioEditar) {
                await pool.query(
                    "UPDATE comentarios SET comentario=? wHERE id_comentarios=?",
                    [cometarioEditar, id]
                );
            }
        };
        res.send({ errors, nombre })
    }
)

module.exports = router;