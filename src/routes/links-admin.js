// Constantes

const express = require("express");
const router = express.Router();
const pool = require("../database");
const { isAdmin } = require("../lib/auth");
var dateFormat = require("dateformat");
const { ROLE } = require('../lib/roles');
const helpers = require('../lib/helpers');
const passport = require("passport");

//Aca va, todo lo que yo quiera que pase si en el buscador pongo /algo

router.get("/choferes", isAdmin, async (req, res) => {
  res.render("admin/choferes");
});

router.get("/choferJSON", isAdmin, async (req, res) => {
  const aux = await pool.query("SELECT u.id_usuario,u.name,u.lastname,u.dni,u.username,u.email FROM usuario u INNER JOIN autoridad a ON (u.id_usuario=a.id_usuario) WHERE a.rol='ROL_CHOFER' ORDER BY u.id_usuario");
  res.send(aux);
});

// CHOFER/DNI
router.post("/chofer/dni", async (req, res) => {
  const { dniValue } = req.body;
  // YA ESTA ACOMODADO PARA LOS CHOFERES UNICAMENTE, PERO SOLO LOS CHOFERES SE REGISTRAN CON DNI, LOS USUARIOS NO, POR LO QUE SERIA ESTUPIDO XD
  const result = await pool.query("SELECT * FROM usuario u INNER JOIN autoridad a ON (u.id_usuario=a.id_usuario) WHERE a.rol='ROL_CHOFER'  AND u.dni=? ", [dniValue]);
  console.log(result);
  if (result.length > 0) {
    res.json(false);
  } else {
    res.json(true);
  }
});

//CHOFER/USERNAME
router.post("/chofer/username", async (req, res) => {
  const { usernameValue } = req.body;
  const result = await pool.query("SELECT * FROM usuario WHERE username=? ", [usernameValue]);
  console.log(result);
  if (result.length > 0) {
    res.json(false);
  } else {
    res.json(true);
  }
});

router.post("/choferes", async (req, res) => {
  let { id, name, lastname, dni, email, username, password, confirmPassword } = req.body;
  if (name == "" || lastname == "" || dni == "" || email == "" || username == "" || password == "" || confirmPassword == "") {
    req.flash('warning', 'Lo siento, no se puede dejar ningun campo en blanco!');
  } else {
    const result = await pool.query("SELECT * FROM usuario WHERE username=?", [username]);
    if (result.length > 0) {
      req.flash('warning', 'lo siento ese nombre de usuario ya existe');
    } else {
      if (password != confirmPassword) {
        console.log('PASS: ', password);
        console.log('CONFIRM: ', confirmPassword);
        req.flash('warning', 'Lo siento,las contrasenias no coinciden!');
      }
      else {
        const result2 = await pool.query("SELECT * FROM usuario WHERE dni=?", [dni]);
        if (result2.length > 0) {
          req.flash('warning', 'lo siento ese documento ya existe ');
        }
      }
    }
  }
  password = await helpers.encryptPassword(password);
  const row = await pool.query("INSERT INTO usuario (name,lastname,dni,email,username,password) VALUES (?,?,?,?,?,?)", [name, lastname, dni, email, username, password]);
  const autoridad = {
    rol: ROLE.CHOFER,
    id_usuario: row.insertId
  };
  await pool.query('INSERT INTO autoridad SET ?', [autoridad]);
  req.flash("success", "Se ha agregado el chofer exitosamente!");
  res.redirect("/admin/choferes");
});

router.delete("/choferes/eliminar", isAdmin, async (req, res) => {
  const { id } = req.body;
  await pool.query("DELETE FROM usuario WHERE id_usuario=?", [id], async (error) => {
    if (error) {
      res.json({result: false, message: 'No es posible eliminar el chofer, ya que el mismo tiene combis asignadas!'});
    } else {
      await pool.query("DELETE FROM autoridad WHERE id_usuario=?", [id]);
      await pool.query("DELETE FROM usuario WHERE id_usuario=?", [id]);
      res.json({result: true, message: "El chofer se ha eliminado existosamente!"});
    }
  });
})


router.get("/insumos", isAdmin, async (req, res) => {
  const row = await pool.query("SELECT * FROM insumo");
  res.render("admin/insumos", { row });
});

router.get("/insumos/eliminar/:id", isAdmin, async (req, res) => {
  // Falta verificar que el insumo no pertenezca a un viaje
  const { id } = req.params;
  const result = await pool.query("SELECT nombre FROM insumo WHERE id_insumo=?", [id]);
  if (result.length > 0) {
    const row = await pool.query("DELETE FROM insumo WHERE id_insumo=?", [id]);
    if (row.affectedRows == 1) {
      req.flash("success", "Se ha borrado el insumo exitosamente!");
    } else {
      req.flash("warning", "El numero de id " + id + " no existe!");
    }
  }
  res.redirect("/admin/insumos");
});

router.post("/insumos", async (req, res) => {
  let { id, nombre, precio, cantidad } = req.body;
  const aux = await pool.query("SELECT * FROM insumo WHERE nombre=?", [nombre]);
  if (aux.length > 0) {
    if (id == aux[0].id_insumo && (aux[0].precio != precio || aux[0].cantidad != cantidad)) {
      await pool.query("UPDATE insumo SET precio=?,cantidad=? WHERE id_insumo=?", [precio, cantidad, id]);
      req.flash("success", "Se ha modificado el insumo exitosamente!");
    } else {
      req.flash("warning", "Lo siento, el insumo " + nombre + " ya existe!");
    }

  } else {
    const blankNombre = nombre.trim() === "";
    const blankPrecio = precio.trim() === "";
    const blankCantidad = cantidad.trim() === "";
    if (id == "") {
      if (blankNombre || blankPrecio || blankCantidad) {
        req.flash("warning", "Ningun campo del insumo puede estar vacio!");
      } else {
        const nombreMayuscula = nombre.toUpperCase();
        await pool.query("INSERT INTO insumo (nombre,precio,cantidad) VALUES (?,?,?)", [nombreMayuscula, precio, cantidad]);
        req.flash("success", "Se ha agregado el insumo exitosamente!");
      }
    } else {
      if (blankNombre) {
        await pool.query("DELETE FROM insumo WHERE id_insumo=?", [id]);
        req.flash("success", "Se ha borrado el insumo exitosamente!");
      } else {
        await pool.query("UPDATE insumo SET nombre=?,precio=?,cantidad=? WHERE id_insumo=?", [nombre, precio, cantidad, id]);
        req.flash("success", "Se ha modificado el insumo exitosamente!");
      }
    }
  }
  res.redirect("/admin/insumos");
});

router.get("/insumosJSON", isAdmin, async (req, res) => {
  const aux = await pool.query(
    "SELECT id_insumo, nombre, precio, cantidad FROM insumo ORDER BY id_insumo"
  );
  res.send(aux);
});

router.get("/lugares", isAdmin, async (req, res) => {
  res.render("admin/lugares");
});

router.post("/lugares", async (req, res) => {
  let { id, nombre } = req.body;
  const row = await pool.query("SELECT nombre FROM lugar WHERE nombre=?", [
    nombre,
  ]);
  if (row.length > 0) {
    req.flash("warning", "Lo siento, el lugar " + nombre + " ya existe!");
  } else {
    const blank = nombre.trim() === "";
    if (id == "") {
      if (blank) {
        req.flash("warning", "El lugar no puede ser vacio!");
      } else {
        await pool.query("INSERT INTO lugar (nombre) VALUES (?)", [nombre.toUpperCase()]);
        req.flash("success", "Se ha agregado el lugar exitosamente!");
      }
    } else {
      const row_editar_deRuta = await pool.query("SELECT * FROM ruta WHERE origen=? OR destino=?", [id, id]);
      if (row_editar_deRuta.length > 0) {
        req.flash(
          "warning",
          "El lugar " +
          nombre +
          " no se puede editar ya que el mismo pertenece a una ruta."
        );
      } else {
        if (blank) {
          await pool.query("DELETE FROM lugar WHERE id_lugar=?", [id]);
          req.flash("success", "Se ha borrado el lugar exitosamente!");
        } else {
          await pool.query("UPDATE lugar SET nombre=? WHERE id_lugar=?", [nombre, id]);
          req.flash("success", "Se ha modificado el lugar exitosamente!");
        }
      }
    }
  }
  res.redirect("/admin/lugares");
});

router.get("/lugares/eliminar/:id", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query("SELECT nombre FROM lugar WHERE id_lugar=?", [
    id,
  ]);
  const row_ruta = await pool.query(
    "SELECT * FROM ruta WHERE origen=? OR destino=?",
    [id, id]
  );
  if (row_ruta.length > 0) {
    req.flash(
      "warning",
      "El lugar " +
      result[0].nombre +
      " no se puede eliminar ya que el mismo pertenece a una ruta."
    );
  } else {
    const row = await pool.query("DELETE FROM lugar WHERE id_lugar=?", [id]);
    if (row.affectedRows == 1) {
      req.flash("success", "Se ha borrado el lugar exitosamente!");
    } else {
      req.flash("warning", "El numero de id " + id + " no existe!");
    }
  }
  res.redirect("/admin/lugares");
});

router.get("/lugaresJSON", isAdmin, async (req, res) => {
  const aux = await pool.query("SELECT * FROM lugar ORDER BY id_lugar");
  res.send(aux);
});


router.get("/combis", isAdmin, async (req, res) => {
  const choferes = await pool.query("SELECT u.name,u.lastname,u.id_usuario FROM usuario u INNER JOIN autoridad a ON(a.id_usuario=u.id_usuario) WHERE (a.rol='ROL_CHOFER')");
  res.render("admin/combis", { choferes });
});

router.get('/combisJSON', isAdmin, async (req, res) => {
  const aux = await pool.query("SELECT * FROM combi");
  res.send(aux);
});

router.post("/combis", async (req, res) => {
  let { id, patente, chofer, cantAsientos, tipoAsientos } = req.body;
  await pool.query("INSERT INTO combi (patente,chofer,cant_asientos,tipo_asiento) VALUES (?,?,?,?)", [patente, chofer, cantAsientos, tipoAsientos]);
  req.flash("success", "Se ha agregado la combi exitosamente!");
  res.redirect("/admin/combis");
});



router.get("/viajes", isAdmin, async (req, res) => {
  res.render("admin/viajes");
});

router.get("/viajesJSON", isAdmin, async (req, res) => {
  const aux = await pool.query("SELECT * FROM viaje");
  for (let i = 0; i < aux.length; i++) {
    aux[i].fecha_salida = dateFormat(aux[i].fecha_salida, "yyyy-mm-dd");
    aux[i].fecha_publicacion = dateFormat(
      aux[i].fecha_publicacion,
      "yyyy-mm-dd"
    );
  }
  res.send(aux);
});

router.get("/rutas", isAdmin, async (req, res) => {
  const lugares = await pool.query("SELECT * FROM lugar");
  res.render("admin/rutas", { lugares });
});

// POST DE RUTAS
router.post("/rutas", async (req, res) => {
  const { id, origen, destino } = req.body;
  if (origen == "" || destino == "") {
    req.flash('warning', 'Lo siento, no se puede dejar ningun campo en blanco!');
  } else {
    const origenResult = await pool.query('SELECT * FROM lugar WHERE nombre=?', [origen]);
    const destinoResult = await pool.query('SELECT * FROM lugar WHERE nombre=?', [destino]);
    if (origenResult.length == 0 || destinoResult.length == 0) {
      req.flash('warning', 'No existe el lugar seleccionado');
    } else {
      const result = await pool.query("SELECT * FROM ruta WHERE origen=? AND destino=?", [origenResult[0].id_lugar, destinoResult[0].id_lugar]);
      if (result.length > 0) {
        req.flash('warning', 'Lo siento, dicha ruta ya existe!');
      } else {
        if (origen == destino) {
          req.flash('warning', 'Lo siento, no se puede ingresar el mismo origen y destino!');
        }
        else {
          if (id == "") {
            await pool.query('INSERT INTO ruta (origen, destino) VALUES (?,?)', [origenResult[0].id_lugar, destinoResult[0].id_lugar]);
            req.flash('success', 'Ruta agregada exitosamente!');
          } else {
            await pool.query("UPDATE ruta SET origen=? , destino=? WHERE id_ruta=?", [origenResult[0].id_lugar, destinoResult[0].id_lugar, id]);
            req.flash('success', 'Ruta modificada exitosamente!');
          }
        }
      }
    }
  }
  res.redirect("/admin/rutas");
});

// ELIMINAR DE RUTAS
router.get("/rutas/eliminar/:id", async (req, res) => {
  const { id } = req.params;
  const aux = await pool.query("SELECT * FROM ruta WHERE id_ruta=?", [id]);
  if (aux.length > 0) {
    await pool.query("DELETE FROM ruta WHERE id_ruta=?", [id]);
    req.flash('success', 'Ruta eliminada exitosamente!');
  } else {
    req.flash('warning', 'Esta ruta no existe!');
  }
  //const result = await pool.query("SELECT origen,destino FROM ruta WHERE id_ruta=?", [id]);
  // const row_ruta = await pool.query("SELECT * FROM ruta WHERE origen=? OR destino=?",[id, id]);
  // if (row_ruta.length > 0) {
  //   req.flash("warning","El lugar " +result[0].nombre +" no se puede eliminar ya que el mismo pertenece a una ruta.");
  // } else {
  //   const row = await pool.query("DELETE FROM lugar WHERE id_lugar=?", [id]);
  //   if (row.affectedRows == 1) {
  //     req.flash("success", "Se ha borrado el lugar exitosamente!");
  //   } else {
  //     req.flash("warning", "El numero de id " + id + " no existe!");
  //   }
  // }
  res.redirect("/admin/rutas");
});

router.get("/rutasJSON", isAdmin, async (req, res) => {
  const aux = await pool.query(
    "SELECT r.id_ruta AS id_ruta, l.nombre AS origen, l2.nombre AS destino FROM ruta r INNER JOIN lugar l ON ( r.origen = l.id_lugar ) INNER JOIN lugar l2 ON ( r.destino = l2.id_lugar ) ORDER BY id_ruta"
  );
  res.send(aux);
});

// Aca exporto el enrutador

module.exports = router;
