// ACA VA LO DE FACU
// Constantes
const express = require('express');
const router = express.Router();
const { hasPermission } = require('../lib/auth');
const pool = require('../database');
var dateFormat = require("dateformat");

// ACA VA EL BUSCAR VIAJE DE LUCAS

router.get('/tickets', hasPermission, (req, res) => {
    const key = req.user.img;
    res.render('user/tickets', {key});
})



router.get("/ticketsJSON", hasPermission, async (req, res) => {
    const usuario = req.user
    id_usuario=usuario.id_usuario
    const aux = await pool.query(
        "SELECT id_usuarioviaje,viaje,estado,cantidad FROM usuario_viaje WHERE usuario=?",[id_usuario]
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

router.delete("/tickets/devolver/", hasPermission, async (req, res) => {
    const { id } = req.body;
    const result = await pool.query("SELECT * FROM usuario_viaje WHERE id_usuarioviaje=?", [id]);
    console.log(result[0].estado)
    if (result[0].estado=="pendiente"){
    //const viaje= result[0].viaje          TODO ESTO ES PARA UPDATEAR LA CATIDAD DE VIAJES LA QUE TENIA + LA Q DEVOLVIERON :D ME FALTA CONSAS EN LA BASE DE DATOS PORQ ESO NO FUNKA
    //let cantidadAnterior= await pool.query("SELECT cantidad FROM viaje WHERE id_viaje=?", [viaje]);
    //cantidadAnterior = cantidadAnterior + result[0].cantidad
    //const devolverCantidadViaje=await pool.query("UPDATE viaje SET cantidad=? WHERE id_viaje=?", [cantidadAnterior,viaje]);   DESPUES DE ESTO TMB HAY Q UPDATEAR LOS INSUMOS Y DEOLVER EL DINERO PERO NO PUEDO HHACER NADA 
    //const await pool.query("DELETE FROM usuario_viaje WHERE id_usuarioviaje=?", [id]);    aca se elimina cuando este todo bien pero no puedi hacer las comprobaciones porq no tengo todo lo anterior :D
    // TENGO Q CAMBIAR EL COLOR DEL BOTON Y LA FIGURA DE LA COLUMNA 
    res.json({
      value: result[0].viaje,
      result: true,
      message: "Se ha devuelto el pasaje exitosamente!"
    });
    }else{
        res.json({
            result: false,
            message: "No se puede eliminar ya que el viaje ya finalizo!",
          });
    }
  });
module.exports = router;






