// Constantes

const express = require("express");
const router = express.Router();
const pool = require("../database");
const { isAdmin } = require("../lib/auth");
var dateFormat = require("dateformat");
const { ROLE } = require('../lib/roles');
const helpers = require('../lib/helpers');
const { body, validationResult } = require('express-validator');

//Aca va, todo lo que yo quiera que pase si en el buscador pongo /algo

router.get("/choferes", isAdmin, async (req, res) => {
  res.render("admin/choferes");
});

router.get("/choferJSON", isAdmin, async (req, res) => {
  const aux = await pool.query(
    "SELECT u.id_usuario,u.name,u.lastname,u.dni,u.username,u.email FROM usuario u INNER JOIN autoridad a ON (u.id_usuario=a.id_usuario) WHERE a.rol='ROL_CHOFER' ORDER BY u.id_usuario"
  );
  res.send(aux);
});

// CHOFER/DNI
router.post("/chofer/dni", async (req, res) => {
  const { usernameValue, idValue } = req.body;
  const result = await pool.query(
    "SELECT * FROM usuario u INNER JOIN autoridad a ON (u.id_usuario=a.id_usuario) WHERE a.rol='ROL_CHOFER'  AND u.username=? ",
    [usernameValue]
  );
  if (result.length > 0) {
    if (result[0].id_usuario == idValue) {
      res.json(true);
    } else {
      res.json(false);
    }
  } else {
    res.json(true);
  }
});

// CHOFER/EMAIL
router.post("/chofer/email", async (req, res) => {
  const { emailValue, idValue } = req.body;
  const result = await pool.query(
    "SELECT * FROM usuario u INNER JOIN autoridad a ON (u.id_usuario=a.id_usuario) WHERE a.rol='ROL_CHOFER'  AND u.email=? ",
    [emailValue]
  );
  if (result.length > 0) {
    if (result[0].id_usuario == idValue) {
      res.json(true);
    } else {
      res.json(false);
    }
  } else {
    res.json(true);
  }
});

//CHOFER/USERNAME
router.post("/chofer/username", async (req, res) => {
  const { usernameValue, idValue } = req.body;
  const result = await pool.query(
    "SELECT * FROM usuario u INNER JOIN autoridad a ON (u.id_usuario=a.id_usuario) WHERE a.rol='ROL_CHOFER'  AND u.username=? ",
    [usernameValue]
  );
  if (result.length > 0) {
    if (result[0].id_usuario == idValue) {
      res.json(true);
    } else {
      res.json(false);
    }
  } else {
    res.json(true);
  }
});

router.post(
  "/choferes",
  body("name").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("lastname").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("dni").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("dni").custom(async (value) => {
    const result = await pool.query(
      "SELECT dni FROM usuario u INNER JOIN autoridad a ON (u.id_usuario=a.id_usuario) WHERE a.rol='ROL_CHOFER' AND dni=?", [value]);
    if (result.length > 0) {
      throw new Error("Lo siento, el DNI ya existe en el sistema!");
    }
  }),
  body("username").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("username").custom(async (value) => {
    const usernameAux = await pool.query("SELECT username FROM usuario u INNER JOIN autoridad a ON (u.id_usuario=a.id_usuario) WHERE a.rol='ROL_CHOFER' AND username=?", [value]);
    if (usernameAux.length > 0) {
      throw new Error(
        "Lo siento, el Nombre de usuario ya existe en el sistema!"
      );
    }
  }),
  body("email").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("email").custom(async (value) => {
    const result = await pool.query(
      "SELECT email FROM usuario u INNER JOIN autoridad a ON (u.id_usuario=a.id_usuario) WHERE a.rol='ROL_CHOFER' AND email=?",
      [value]
    );
    if (result.length > 0) {
      throw new Error("Lo siento, el Email ya existe en el sistema!");
    }
  }),
  body("password").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("confirmPassword")
    .notEmpty()
    .withMessage("Este campo no puede estar vacio!"),
  async (req, res) => {
    var { id, dni, username, email, name, lastname, password } = req.body;
    const result = validationResult(req);
    const errors = result.errors;
    if (result.isEmpty()) {
      if (id == "") {
        password = await helpers.encryptPassword(password);
        const row = await pool.query(
          "INSERT INTO usuario (name,lastname,email,username,password,dni) VALUES (?,?,?,?,?,?)",
          [name, lastname, email, username, password, dni]
        );
        const autoridad = {
          rol: ROLE.CHOFER,
          id_usuario: row.insertId,
        };
        await pool.query("INSERT INTO autoridad SET ?", [autoridad]);
      } else {
        await pool.query(
          "UPDATE usuario SET name=?,lastname=?,email=?,username=?,password=?,dni=? WHERE id_usuario=?",
          [name, lastname, email, username, password, dni, id]
        );
      }
    }
    res.send(errors);
  }
);

router.delete("/choferes/eliminar", isAdmin, async (req, res) => {
  const { id } = req.body;
  const result = await pool.query("SELECT * FROM combi WHERE chofer=?", [id]);
  if (result.length > 0) {
    res.json({
      result: false,
      message:
        "No es posible eliminar el chofer, ya que el mismo tiene combis asignadas!",
    });
  } else {
    await pool.query("DELETE FROM autoridad WHERE id_usuario=?", [id]);
    await pool.query("DELETE FROM usuario WHERE id_usuario=?", [id]);
    res.json({
      result: true,
      message: "El chofer se ha eliminado existosamente!",
    });
  }

  // await pool.query("DELETE FROM usuario WHERE id_usuario=?", [id], async (error) => {
  //   if (error) {
  //     res.json({ result: false, message: 'No es posible eliminar el chofer, ya que el mismo tiene combis asignadas!' });
  //   } else {
  //     await pool.query("DELETE FROM autoridad WHERE id_usuario=?", [id]);
  //     await pool.query("DELETE FROM usuario WHERE id_usuario=?", [id]);
  //     res.json({ result: true, message: "El chofer se ha eliminado existosamente!" });
  //   }
  // });
});

router.get("/insumos", isAdmin, async (req, res) => {
  const row = await pool.query("SELECT * FROM insumo");
  res.render("admin/insumos", { row });
});

router.delete("/insumos/eliminar/", isAdmin, async (req, res) => {
  const { id } = req.body;
  /*const result = await pool.query("SELECT * FROM viaje WHERE insumo=?", [id]);
  if (result.length > 0) {
    res.json({
      result: false,                          aca va la comprobacion de q no este en un viaje vendido este inusmo pero no tenemos una vrg de viajes asi qno se puede hacer :D
      message:
        "No es posible eliminar el insumo porqn esta en un vieja !",
    });
  }*/
  await pool.query("DELETE FROM insumo WHERE id_insumo=?", [id]);
  res.json({
    result: true,
    message: "El insumo se ha eliminado existosamente!",
  });


})



router.post("/insumos", body("nombre").notEmpty().withMessage("El campo Nombre no puede estar vacio!"), body("nombre").custom(async (value) => {
  const result = await pool.query("SELECT nombre FROM insumo WHERE nombre=?", [value]);
  if (result.length > 0) {
    throw new Error("Lo siento, el insumo ya existe en el sistema!");
  }
}),
  body("precio").notEmpty().withMessage("El campo Precio no puede estar vacio!"),
  body("cantidad").notEmpty().withMessage("El campo Cantidad no puede estar vacio!"),
  async (req, res) => {
    var { id, nombre, precio, cantidad } = req.body;
    nombre = nombre.toUpperCase();
    const result = validationResult(req);
    const errors = result.errors;
    if (result.isEmpty()) {
      if (id == "") {
        await pool.query("INSERT INTO insumo (nombre,precio,cantidad) VALUES (?,?,?)", [nombre, precio, cantidad]);
      } else {
        await pool.query("UPDATE insumo SET nombre=? , precio=? , cantidad= ? WHERE id_insumo=?", [nombre, precio, cantidad, id]);
      }
    }
    res.send(errors);
  }
);




/*let { id, nombre, precio, cantidad } = req.body;
const aux = await pool.query("SELECT * FROM insumo WHERE nombre=?", [nombre]);
if (aux.length > 0) {
  if (
    id == aux[0].id_insumo &&
    (aux[0].precio != precio || aux[0].cantidad != cantidad)
  ) {
    await pool.query(
      "UPDATE insumo SET precio=?,cantidad=? WHERE id_insumo=?",
      [precio, cantidad, id]
    );
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
      await pool.query(
        "INSERT INTO insumo (nombre,precio,cantidad) VALUES (?,?,?)",
        [nombreMayuscula, precio, cantidad]
      );
      req.flash("success", "Se ha agregado el insumo exitosamente!");
    }
  } else {
    if (blankNombre) {
      await pool.query("DELETE FROM insumo WHERE id_insumo=?", [id]);
      req.flash("success", "Se ha borrado el insumo exitosamente!");
    } else {
      await pool.query(
        "UPDATE insumo SET nombre=?,precio=?,cantidad=? WHERE id_insumo=?",
        [nombre, precio, cantidad, id]
      );
      req.flash("success", "Se ha modificado el insumo exitosamente!");
    }
  }
}
res.redirect("/admin/insumos");
});*/

router.get("/insumosJSON", isAdmin, async (req, res) => {
  const aux = await pool.query(
    "SELECT id_insumo, nombre, precio, cantidad FROM insumo ORDER BY id_insumo"
  );
  res.send(aux);
});

router.get("/lugares", isAdmin, async (req, res) => {
  res.render("admin/lugares");
});

router.post("/lugares",
  body('nombre').notEmpty().withMessage('El campo Nombre no puede estar vacio!'),
  body('nombre').custom(async (value) => {
    const result = await pool.query('SELECT nombre FROM lugar WHERE nombre=?', [value]);
    if (result.length > 0) {
      throw new Error('Lo siento, el lugar ya existe en el sistema!');
    }
  }),
  async (req, res) => {
    var { id, nombre } = req.body;
    nombre = nombre.toUpperCase();
    const result = validationResult(req);
    const errors = result.errors;
    if (result.isEmpty()) {
      if (id == "") {
        await pool.query("INSERT INTO lugar (nombre) VALUES (?)", [nombre]);
      } else {
        await pool.query("UPDATE lugar SET nombre=? WHERE id_lugar=?", [nombre, id]);
      }
    }
    res.send(errors);
  });

router.post("/lugar/nombre", async (req, res) => {
  const { nameValue, idValue } = req.body;
  // YA ESTA ACOMODADO PARA LOS CHOFERES UNICAMENTE, PERO SOLO LOS CHOFERES SE REGISTRAN CON DNI, LOS USUARIOS NO, POR LO QUE SERIA ESTUPIDO XD
  const result = await pool.query("SELECT * FROM lugar WHERE nombre=?", [nameValue]);
  if (result.length > 0) {
    if (idValue == result[0].id_lugar) {
      res.json(true);
    } else {
      res.json(false);
    }
  } else {
    res.json(true);
  }
});

router.delete("/lugares/eliminar", isAdmin, async (req, res) => {
  const { id } = req.body;
  const result = await pool.query("SELECT * FROM ruta WHERE origen=? OR destino=?", [id, id]);
  if (result.length > 0) {
    res.json({ result: false, message: 'No es posible eliminar el lugar, ya que el mismo tiene ruta/s asignada/s!' });
  } else {
    await pool.query("DELETE FROM lugar WHERE id_lugar=?", [id]);
    res.json({ result: true, message: "El lugar se ha eliminado existosamente!" });
  }
})

// router.get("/lugares/eliminar/:id", async (req, res) => {
//   const { id } = req.params;
//   const result = await pool.query("SELECT nombre FROM lugar WHERE id_lugar=?", [
//     id,
//   ]);
//   const row_ruta = await pool.query(
//     "SELECT * FROM ruta WHERE origen=? OR destino=?",
//     [id, id]
//   );
//   if (row_ruta.length > 0) {
//     req.flash(
//       "warning",
//       "El lugar " +
//       result[0].nombre +
//       " no se puede eliminar ya que el mismo pertenece a una ruta."
//     );
//   } else {
//     const row = await pool.query("DELETE FROM lugar WHERE id_lugar=?", [id]);
//     if (row.affectedRows == 1) {
//       req.flash("success", "Se ha borrado el lugar exitosamente!");
//     } else {
//       req.flash("warning", "El numero de id " + id + " no existe!");
//     }
//   }
//   res.redirect("/admin/lugares");
// });

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
