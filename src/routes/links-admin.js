// Constantes

const express = require('express');
const router = express.Router();
const pool = require('../database');
const { isAdmin } = require('../lib/auth');
var dateFormat = require('dateformat');

//Aca va, todo lo que yo quiera que pase si en el buscador pongo /algo

router.get('/chofer', isAdmin, async(req, res) => { 
    res.render('admin/choferes');
});

router.get('/choferJSON', isAdmin, async(req, res) => {
    const aux = await pool.query("SELECT id_usuario, name, lastname, username, email FROM usuario ORDER BY id_usuario");
    res.send(aux);
});

router.get('/insumos', isAdmin, async(req, res) => { 
    res.render('admin/insumos');
});

// router.get('/insumosJSON', isAdmin, async(req, res) => {
//     const aux = await pool.query("SELECT ID, name, precio, cantidad FROM insumos");
//     res.send(aux);
// });

router.get('/lugares', isAdmin, async(req, res) => { 
    res.render('admin/lugares');
});

router.post('/lugares', async(req, res) => { 
    let {id, nombre} = req.body;
    nombre = nombre.toUpperCase();
    const row = await pool.query("SELECT nombre FROM lugar WHERE nombre=?", [nombre]);
    if (row.length > 0) {
        req.flash('warning', 'Lo siento, el lugar '+nombre+' ya existe!');
    } else {
        await pool.query("UPDATE lugar SET nombre=? WHERE id_lugar=?", [nombre, id]);
        req.flash('success', 'Se ha modificado el lugar exitosamente!');
    }
    res.redirect('/admin/lugares');
});
router.get('/lugares/eliminar/:id', async (req,res) => {
    const { id } = req.params;
    const result = await pool.query("SELECT nombre FROM lugar WHERE id_lugar=?",[id]);
    const row_ruta = await pool.query("SELECT * FROM ruta WHERE origen=? OR destino=?", [id,id]);
    if (row_ruta.length > 0){
        req.flash('warning', 'El lugar '+ result[0].nombre +' no se puede eliminar ya que el mismo pertenece a una ruta.');
    }else{
    const row = await pool.query("DELETE FROM lugar WHERE id_lugar=?", [id]);
    if (row.affectedRows == 1){
        req.flash('success', 'Se ha borrado el lugar exitosamente!');
    }else{
        req.flash('warning', 'El numero de id '+id+' no existe!');
    }
}
    res.redirect('/admin/lugares');
});

router.get('/lugaresJSON', isAdmin, async(req, res) => {
    const aux = await pool.query("SELECT * FROM lugar ORDER BY id_lugar");
    res.send(aux);
});

// router.get('/lugar/editar/' + value, async (req,res) => {
//     const edit = await pool.query("");
// })

router.get('/combis', isAdmin, async(req, res) => { 
    res.render('admin/combis');
});

// router.get('/combisJSON', isAdmin, async(req, res) => {
//     const aux = await pool.query("SELECT ID, patente, chofer, cantidadAsientos FROM combis");
//     res.send(aux);
// });

router.get('/viajes', isAdmin, async(req, res) => { 
    res.render('admin/viajes');
});

router.get('/viajesJSON', isAdmin, async(req, res) => {
    const aux = await pool.query("SELECT * FROM viaje");
    for (let i = 0; i < aux.length; i++) {
        aux[i].fecha_salida = dateFormat(aux[i].fecha_salida, "yyyy-mm-dd");
        aux[i].fecha_publicacion = dateFormat(aux[i].fecha_publicacion, "yyyy-mm-dd");
    }
    res.send(aux);
});

router.get('/rutas', isAdmin, async(req, res) => { 
    res.render('admin/rutas');
});

router.get('/rutasJSON', isAdmin, async(req, res) => {
    const aux = await pool.query("SELECT r.id_ruta AS id_ruta, l.nombre AS origen, l2.nombre AS destino FROM ruta r INNER JOIN lugar l ON ( r.origen = l.id_lugar ) INNER JOIN lugar l2 ON ( r.destino = l2.id_lugar ) ORDER BY id_ruta");
    res.send(aux);
});


// Aca exporto el enrutador

module.exports = router;