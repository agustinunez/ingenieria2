// Constantes

const express = require("express");
const router = express.Router();
const pool = require("../database");
const { isAdmin } = require("../lib/auth");
var dateFormat = require("dateformat");
const { ROLE } = require('../lib/roles');
const helpers = require('../lib/helpers');
const { body, validationResult } = require('express-validator');
const moment = require('moment');

//ROUTER GET Y POST
// ============================================== Chofer View =================================================


router.get('/statistics', isAdmin, (req, res) => {
  const key = req.user.img;
  res.render("admin/statistics", {key});
});










//---------------------------------------------------------------------------------------------------CHOFER-------------------------------------------------------------------------------------

router.get("/choferes", isAdmin, async (req, res) => {
  const key = req.user.img;
  res.render("admin/choferes", {key});
});

router.get("/choferJSON", isAdmin, async (req, res) => {
  const aux = await pool.query(
    "SELECT u.id_usuario,u.name,u.lastname,u.dni,u.username,u.email FROM usuario u INNER JOIN autoridad a ON (u.id_usuario=a.id_usuario) WHERE a.rol='ROL_CHOFER' ORDER BY u.id_usuario"
  );
  res.send(aux);
});

// CHOFER/DNI
router.post('/combis/chofer', async (req, res) => {
  const { id } = req.body;
  const resultChofer = await pool.query("SELECT chofer FROM combi WHERE id_combi=?", [id]);
  if (resultChofer.length > 0) {
    res.send({
      result: true,
      value: resultChofer[0].chofer
    });
  } else {
    res.send({
      result: false
    })
  }
})

router.post("/chofer/dni", async (req, res) => {
  const { dniValue, idValue } = req.body;
  const result = await pool.query(
    "SELECT * FROM usuario u INNER JOIN autoridad a ON (u.id_usuario=a.id_usuario) WHERE a.rol='ROL_CHOFER' AND u.dni=?",
    [dniValue]);
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

router.post("/choferes",
  body("name").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("lastname").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("dni").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("email").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("username").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("password").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("confirmPassword").notEmpty().withMessage("Este campo no puede estar vacio!"),
  async (req, res) => {
    var { id, dni, username, email, name, lastname, password } = req.body;
    const result = validationResult(req);
    const errors = result.errors;

    const rowDni = await pool.query(
      "SELECT u.id_usuario " +
      "FROM usuario u INNER JOIN autoridad a ON (u.id_usuario=a.id_usuario) " +
      "WHERE a.rol='ROL_CHOFER' AND u.dni=?", [dni]);
    if (rowDni.length > 0) {
      if (rowDni[0].id_usuario != id) {
        errors.push({
          value: '',
          msg: 'Lo siento, el DNI ya existe en el sistema!',
          param: 'dni',
          location: 'body'
        });
      }
    }

    const rowEmail = await pool.query("SELECT id_usuario FROM usuario WHERE email=?", [email]);
    if (rowEmail.length > 0) {
      if (rowEmail[0].id_usuario != id) {
        errors.push({
          value: '',
          msg: 'Lo siento, el Email ya existe en el sistema!',
          param: 'email',
          location: 'body'
        });
      }
    }

    const rowUsername = await pool.query("SELECT id_usuario FROM usuario WHERE username=?", [username]);
    if (rowUsername.length > 0) {
      if (rowUsername[0].id_usuario != id) {
        errors.push({
          value: '',
          msg: 'Lo siento, el Nombre de usuario ya existe en el sistema!',
          param: 'username',
          location: 'body'
        });
      }
    }

    if (errors.length == 0) {
      password = await helpers.encryptPassword(password);
      if (id == "") {
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
});

//---------------------------------------------------------------------------------------------------FIN DE CHOFERES-------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------INSUMOS-------------------------------------------------------------------------------------
router.get("/insumos", isAdmin, async (req, res) => {
  const row = await pool.query("SELECT * FROM insumo");
  const key = req.user.img;
  res.render("admin/insumos", { row, key });
});

router.post("/insumo/nombre", isAdmin, async (req, res) => {
  const { nombreValue, idValue } = req.body;
  const result = await pool.query("SELECT * FROM insumo WHERE nombre=?", [nombreValue]);
  if (result.length > 0) {
    if (idValue == result[0].id_insumo) {
      res.json(true);
    } else {
      res.json(false);
    }
  } else {
    res.json(true);
  }
});

router.delete("/insumos/eliminar/", isAdmin, async (req, res) => {
  const { id } = req.body;
  const result = await pool.query("SELECT * FROM viaje_insumos WHERE insumo=?", [id]);
  if (result.length > 0) {
    res.json({
      result: false,                        
      message:
        "No es posible eliminar el insumo ya que pertenece a un viaje!",
    });
  } else {
    await pool.query("DELETE FROM insumo WHERE id_insumo=?", [id]);
    res.json({
      result: true,
      message: "El insumo se ha eliminado existosamente!",
    });
  }
})

router.post("/insumos",
  body("nombre").notEmpty().withMessage("El campo Nombre no puede estar vacio!"),
  body("precio").notEmpty().withMessage("El campo Precio no puede estar vacio!"),
  body("cantidad").notEmpty().withMessage("El campo Cantidad no puede estar vacio!"),
  async (req, res) => {
    var { id, nombre, precio, cantidad } = req.body;
    nombre = nombre.toUpperCase();
    const result = validationResult(req);
    const errors = result.errors;

    const resultInsumo = await pool.query("SELECT id_insumo FROM insumo WHERE nombre=?", [nombre]);
    if (resultInsumo.length > 0) {
      if (resultInsumo[0].id_insumo != id) {
        errors.push({
          value: '',
          msg: 'Lo siento, el insumo ya existe en el sistema!',
          param: 'nombre',
          location: 'body'
        });
      }
    }
    if (errors.length == 0) {
      if (id == "") {
        await pool.query("INSERT INTO insumo (nombre,precio,cantidad) VALUES (?,?,?)", [nombre, precio, cantidad]);
      } else {
        await pool.query("UPDATE insumo SET nombre=? , precio=? , cantidad= ? WHERE id_insumo=?", [nombre, precio, cantidad, id]);
      }
    }
    res.send(errors);
  }
);


router.get("/insumosJSON", isAdmin, async (req, res) => {
  const aux = await pool.query(
    "SELECT id_insumo, nombre, precio, cantidad FROM insumo ORDER BY id_insumo"
  );
  res.send(aux);
});
//---------------------------------------------------------------------------------------------------FIN DE INSUMOS-------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------LUGARES-------------------------------------------------------------------------------------
router.get("/lugares", isAdmin, async (req, res) => {
  const key = req.user.img;
  res.render("admin/lugares", {key} );
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

router.get("/lugaresJSON", isAdmin, async (req, res) => {
  const aux = await pool.query("SELECT * FROM lugar ORDER BY id_lugar");
  res.send(aux);
});
//---------------------------------------------------------------------------------------------------FIN DE LUGARES-------------------------------------------------------------------------------------




//---------------------------------------------------------------------------------------------------COMBIS-------------------------------------------------------------------------------------
router.post("/combis/patente", async (req, res) => {
  const { patenteValue, idValue } = req.body;
  const result = await pool.query("SELECT * FROM combi WHERE patente=? ", [patenteValue]);
  if (result.length > 0) {
    if (result[0].id_combi == idValue) {
      res.json(true);
    } else {
      res.json(false);
    }
  } else {
    res.json(true);
  }
});

router.get("/combis", isAdmin, async (req, res) => {
  // ENVIO LOS CHOFERES PARA LISTARLOS PARA SELECCIONARLOS
  const key = req.user.img;
  const choferes = await pool.query("SELECT u.name,u.lastname,u.id_usuario FROM usuario u INNER JOIN autoridad a ON(a.id_usuario=u.id_usuario) WHERE (a.rol='ROL_CHOFER')");
  res.render("admin/combis", { choferes, key });
});

router.get('/combisJSON', isAdmin, async (req, res) => {
  const aux = await pool.query("SELECT * FROM combi");

  for (let i = 0; i < aux.length; i++) {
    const choferResult = await pool.query("SELECT name, lastname FROM usuario WHERE id_usuario=?", [aux[i].chofer]);
    aux[i].chofer = choferResult[0].name + ' ' + choferResult[0].lastname;
  }

  res.send(aux);
});

router.post("/combis",
  body("patente").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("chofer").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("cantAsientos").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("cantAsientos").custom(async (value) => {
    if (value < 0) {
      throw new Error("Lo siento, la Cantidad de asientos debe ser mayor a 0!");
    }
  }),
  body("tipoAsientos").notEmpty().withMessage("Este campo no puede estar vacio!"),

  async (req, res) => {
    var { id, patente, chofer, cantAsientos, tipoAsientos } = req.body;
    const result = validationResult(req);
    const errors = result.errors;
    patente = patente.toUpperCase();
    const resultCombi = await pool.query("SELECT id_combi FROM combi WHERE patente=?", [patente]);
    if (resultCombi.length > 0) {
      if (resultCombi[0].id_combi != id) {
        errors.push({
          value: '',
          msg: 'Lo siento, la Patente ya existe en el sistema!',
          param: 'patente',
          location: 'body'
        });
      }
    }
    if (errors.length == 0) {
      if (id == "") {
        await pool.query("INSERT INTO combi (patente,chofer,cant_asientos,tipo_asiento) VALUES (?,?,?,?)", [patente, chofer, cantAsientos, tipoAsientos]);
      } else {
        await pool.query("UPDATE combi SET patente=?,chofer=?,cant_asientos=?,tipo_asiento=? WHERE id_combi=?", [patente, chofer, cantAsientos, tipoAsientos, id]);
      }
    }
    res.send(errors);
  }
);

router.delete("/combis/eliminar", isAdmin, async (req, res) => {
  const { id } = req.body;
  const result = await pool.query("SELECT * FROM combi WHERE id_combi=?", [id]);
  if (result.length > 0) {
    const resultViaje = await pool.query("SELECT * FROM viaje WHERE combi=?", [id]);
    if (resultViaje.length > 0) {
      res.json({
        result: false,
        message: "No es posible eliminar la combi, ya que la misma tiene viaje/s asignado/s!",
      });
    } else {
      await pool.query("DELETE FROM combi WHERE id_combi=?", [id]);
      res.json({
        result: true,
        message: "Se ha eliminado el chofer exitosamente!",
      });
    }
  } else {
    res.json({
      result: false,
      message: 'No existe la combi con ID ' + id + '!',
    });
  }
});



//---------------------------------------------------------------------------------------------------FIN DE COMBIS-------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------------------VIAJES-------------------------------------------------------------------------------------
router.get("/viajes", isAdmin, async (req, res) => {
  const key = req.user.img;
  const insumos = await pool.query("SELECT nombre,id_insumo FROM insumo");
  const combis = await pool.query("SELECT patente,id_combi FROM combi");
  const rutas = await pool.query("SELECT r.origen AS origenid ,r.destino AS destinoid,r.id_ruta AS id_ruta,l.nombre AS nombreorigen,l2.nombre AS nombredestino FROM ruta r INNER JOIN lugar l ON (r.origen=l.id_lugar) INNER JOIN lugar l2 ON (r.destino=l2.id_lugar) ORDER BY l.nombre, l2.nombre");
  res.render("admin/viajes", { rutas, combis, insumos, key });
});

router.post("/viajes/fechasalida", isAdmin, async (req, res) => {
  const { fechasalidaValue, idValue } = req.body;
  if (fechasalidaValue < moment().format('YYYY-MM-DD')) {
    res.json(false);
  } else {
    res.json(true);
  }
});

router.post("/viajes/horasalida", isAdmin, async (req, res) => {
  const { horasalidaValue, fechasalidaValue, idValue } = req.body;

  if (fechasalidaValue != '') {
    if (fechasalidaValue.toString() === moment().format("YYYY-MM-DD").toString()) {
      if (horasalidaValue < moment().format("HH:mm")) {
        res.json(false);
      } else {
        res.json(true);
      }
    }
  } else {
    res.json(true);
  }
});

router.post("/viajes/fechallegada", isAdmin, async (req, res) => {
  const { fechasalidaValue, fechallegadaValue, idValue } = req.body;

  if (fechasalidaValue != '') {
    if (fechasalidaValue > fechallegadaValue) {
      res.json(false);
    } else {
      res.json(true);
    }
  } else {
    res.json(true);
  }
});

router.post("/viajes/horallegada", isAdmin, async (req, res) => {
  const { fechasalidaValue, fechallegadaValue, horasalidaValue, horallegadaValue, idValue } = req.body;

  if (fechasalidaValue != '' && fechallegadaValue != '' && horasalidaValue != '') {
    if (fechasalidaValue == fechallegadaValue) {
      if (horasalidaValue > horallegadaValue) {
        res.json(false);
      } else {
        res.json(true);
      }
    } else {
      res.json(true);
    }
  } else {
    res.json(true);
  }
});

router.post('/viajes/asientos', async (req, res) => {
  const { asientosValue, combiValue, idValue } = req.body;
  const resultCombi = await pool.query("SELECT cant_asientos FROM combi WHERE id_combi=?", [combiValue]);
  if (resultCombi.length > 0) {
    if (asientosValue > resultCombi[0].cant_asientos) {
      res.send({
        result: false,
        reason: 'combi',
        value: resultCombi[0].cant_asientos
      });
    } else {
      if (idValue != '') {
        let currentTrip2 = await pool.query("SELECT * FROM viaje WHERE id_viaje=?", [idValue]);
        if (currentTrip2.length > 0) {
          if (asientosValue < currentTrip2[0].asientos_asignados) {
            let diferenciaAsientos2 = currentTrip2[0].asientos_asignados - asientosValue;
            if (currentTrip2[0].asientos_disponibles - diferenciaAsientos2 < 0) {
              res.send({
                result: false,
                reason: 'disponibles'
              });
            } else {
              res.send({
                result: true
              });
            }
          } else {
            res.send({
              result: true
            });
          }
        } else {
          res.send({
            result: true
          });
        }
      } else {
        res.send({
          result: true
        });
      }
    }
  } else {
    res.send({
      result: true
    });
  }
})

router.post('/viajes/combi', async (req, res) => {
  const { id } = req.body;
  const resultCombi = await pool.query("SELECT combi FROM viaje WHERE id_viaje=?", [id]);
  if (resultCombi.length > 0) {
    res.send({
      result: true,
      value: resultCombi[0].combi
    });
  } else {
    res.send({
      result: false
    })
  }
})

router.post('/viajes/ruta', async (req, res) => {
  const { id } = req.body;
  const resultRuta = await pool.query("SELECT ruta FROM viaje WHERE id_viaje=?", [id]);
  if (resultRuta.length > 0) {
    res.send({
      result: true,
      value: resultRuta[0].ruta
    });
  } else {
    res.send({
      result: false
    })
  }
})

router.get("/viajesJSON", isAdmin, async (req, res) => {
  const aux = await pool.query("SELECT * FROM viaje");
  for (let i = 0; i < aux.length; i++) {

    const patenteCombi = await pool.query(" SELECT patente FROM combi WHERE id_combi=?", [aux[i].combi]);
    aux[i].combi = patenteCombi[0].patente;
    const rutasViaje = await pool.query("SELECT r.origen AS origenid ,r.destino AS destinoid,r.id_ruta AS id_ruta,l.nombre AS nombreorigen,l2.nombre AS nombredestino FROM ruta r INNER JOIN lugar l ON (r.origen=l.id_lugar) INNER JOIN lugar l2 ON (r.destino=l2.id_lugar) WHERE id_ruta=?", [aux[i].ruta]);
    aux[i].ruta = rutasViaje[0].nombreorigen + ' - ' + rutasViaje[0].nombredestino;
    //  console.log(rutasViaje);
    aux[i].fecha_salida = dateFormat(aux[i].fecha_salida, "yyyy-mm-dd");
    aux[i].fecha_publicacion = dateFormat(aux[i].fecha_publicacion, "yyyy-mm-dd");
    aux[i].fecha_llegada = dateFormat(aux[i].fecha_llegada, "yyyy-mm-dd");
  }
  res.send(aux);
});

router.get("/insumosViajeJSON/:id", isAdmin, async (req, res) => {
  const { id } = req.params;
  const aux = await pool.query("SELECT i.nombre AS nombre, vi.cantidad AS cantidad, vi.id_viajeinsumos AS id_viaje FROM viaje_insumos vi INNER JOIN insumo i ON (vi.insumo = i.id_insumo) WHERE viaje=?", [id]);
  res.send(aux);
});

router.post("/viajes/insumos", 
body("insumo").notEmpty().withMessage("Este campo no puede estar vacio!"),
body("cantidad").notEmpty().withMessage("Este campo no puede estar vacio!"),
body("cantidad").custom(async (value) => {
  if (value < 1) {
    throw new Error("Lo siento, la Cantidad debe ser mayor a 0!");
  }
}),

async (req, res) => {
  const { id_insumoViaje, insumo, cantidad } = req.body;
  const result = validationResult(req);
  const errors = result.errors;
  const resultInsumo = await pool.query("SELECT * FROM insumo WHERE id_insumo=?", [insumo]);
  const resultViajeInsumo = await pool.query("SELECT * FROM viaje_insumos WHERE viaje=? AND insumo=?", [id_insumoViaje, insumo]);

  if (cantidad != '' && cantidad > 0) {
    if (cantidad > resultInsumo[0].cantidad) {
      errors.push({
        value: "",
        msg: "Cantidad superior al stock! (Stock = " + resultInsumo[0].cantidad + ')',
        param: "cantidad",
        location: "body",
      });
    }
  }

  if (errors.length == 0) {
    if (resultViajeInsumo.length > 0) {
      const newQuantity = +resultViajeInsumo[0].cantidad + +cantidad;
      await pool.query('UPDATE viaje_insumos SET cantidad=? WHERE id_viajeinsumos=?', [newQuantity, resultViajeInsumo[0].id_viajeinsumos]);
    } else {
      await pool.query('INSERT INTO viaje_insumos (viaje, insumo, cantidad) VALUES(?,?,?)', [id_insumoViaje, insumo, cantidad]); 
    }
    await pool.query('UPDATE insumo SET cantidad=? WHERE id_insumo=?', [(resultInsumo[0].cantidad - cantidad), insumo]);   
  }
  res.send(errors);
});

router.post("/viajes",
  body("ruta").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("fechasalida").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("fechasalida").custom(async (value) => {
    if (value != '' && value < moment().format('YYYY-MM-DD')) {
      throw new Error("Lo siento, la Fecha de salida debe ser mayor o igual a la fecha actual!");
    }
  }),
  body("horasalida").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("fechallegada").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("horallegada").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("combi").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("asientosAsignados").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("fechapublicacion").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("precio").notEmpty().withMessage("Este campo no puede estar vacio!"),

  async (req, res) => {
    var { id, ruta, fechasalida, horasalida, fechallegada, horallegada, combi, asientosAsignados, fechapublicacion, precio } =
      req.body;
    const result = validationResult(req);
    const errors = result.errors;

    if (fechasalida != '' && horasalida != '') {
      if (
        !(fechasalida > moment().format("YYYY-MM-DD")) &&
        !(fechasalida < moment().format("YYYY-MM-DD"))
      ) {
        if (horasalida < moment().format("HH:mm")) {
          errors.push({
            value: "",
            msg: "Lo siento, la Hora de salida debe ser mayor o igual a la hora actual!",
            param: "horasalida",
            location: "body",
          });
        }
      }
    }

    if (fechasalida != '' && fechallegada != '') {
      if (fechasalida > fechallegada) {
        errors.push({
          value: "",
          msg: "Lo siento, la Fecha de llegada debe ser mayor o igual a la Fecha de salida!",
          param: "fechallegada",
          location: "body",
        });
      }
    }

    if (fechasalida != '' && fechallegada != '' && horasalida != '' && horallegada != '') {
      if (fechasalida.toString() === fechallegada.toString()) {
        if (horallegada < horasalida) {
          errors.push({
            value: "",
            msg: "Lo siento, la Hora de llegada debe ser mayor o igual a la Hora de salida!",
            param: "horallegada",
            location: "body",
          });
        }
      }
    }

    if (fechasalida != '' && fechapublicacion != '') {
      if (fechapublicacion > fechasalida) {
        errors.push({
          value: "",
          msg: "Lo siento, la Fecha de publicacion debe ser mayor o igual a la Fecha de salida!",
          param: "fechapublicacion",
          location: "body",
        });
      }
    }

    if (asientosAsignados != '' && combi != '') {
      const resultCombi = await pool.query("SELECT cant_asientos FROM combi WHERE id_combi=?", [combi]);
      if (resultCombi.length > 0) {
        if (asientosAsignados > resultCombi[0].cant_asientos) {
          errors.push({
            value: "",
            msg: "Lo siento, la combi posee ["+resultCombi[0].cant_asientos+"] asientos!",
            param: "asientosAsignados",
            location: "body",
          });
        }
      }
    }

    if (asientosAsignados != '' && id != '') {
      const currentTrip = await pool.query("SELECT * FROM viaje WHERE id_viaje=?", [id]);
      if (currentTrip.length > 0) {
        if (asientosAsignados < currentTrip[0].asientos_asignados) {
          let diferenciaAsientos = currentTrip[0].asientos_asignados - asientosAsignados;
          if (currentTrip[0].asientos_disponibles - diferenciaAsientos < 0) {
            errors.push({
              value: "",
              msg: "Lo siento, no puedes asignar menos asientos que los ya vendidos!",
              param: "asientosAsignados",
              location: "body",
            });
          }
        }
      }
    }

    if (combi != '' && fechasalida != '' && horasalida != '') {
      const isOk = await pool.query("SELECT * FROM viaje WHERE combi=? AND fecha_salida=? AND hora_salida=?", [combi, fechasalida, horasalida]);
      if (isOk.length > 0) {
        if (id != isOk[0].id_viaje) {
          errors.push({
            value: "",
            msg: "Lo siento, la combi no esta disponible para dicha Fecha y Hora!",
            param: "viaje",
            location: "body",
          });
        }
      }
    }
    if (combi != '' && fechasalida != '' && horasalida != '' && fechallegada != '' && horallegada != '') {
      if (fechallegada >= fechasalida && !(fechallegada.toString() === fechasalida.toString() && horallegada < horasalida)) {
        const viajes = await pool.query("SELECT * FROM viaje WHERE combi=?", [combi]);
        if (viajes.length > 0) {
          for (let i = 0; i < viajes.length; i++) {
            if (viajes[i].id_viaje != id) {
              var estaViajando = helpers.combiViajagando(fechasalida, horasalida, fechallegada, horallegada, viajes[i]);
              if (estaViajando) {
                errors.push({
                  value: "",
                  msg: "Lo siento, la combi no esta disponible para dicha Fecha y Hora!",
                  param: "combi",
                  location: "body",
                });
                break;
              }
            }
          }
        }
      }

    }

    if (errors.length == 0) {
      if (id == "") {
        await pool.query(
          "INSERT INTO viaje (ruta, fecha_salida, hora_salida, fecha_llegada, hora_llegada, asientos_asignados, asientos_disponibles, combi, fecha_publicacion, precio) VALUES (?,?,?,?,?,?,?,?,?,?)",
          [ruta, fechasalida, horasalida, fechallegada, horallegada, asientosAsignados, asientosAsignados, combi, fechapublicacion, precio]
        );
      } else {
        const viajeActual = await pool.query("SELECT * FROM viaje WHERE id_viaje=?", [id]);
        if (asientosAsignados == viajeActual[0].asientos_asignados) {
          await pool.query(
            "UPDATE viaje SET ruta=?,fecha_salida=?,hora_salida=?,combi=?,fecha_publicacion=?,precio=?,fecha_llegada=?,hora_llegada=? WHERE id_viaje=?",
            [ruta, fechasalida, horasalida, combi, fechapublicacion, precio, fechallegada, horallegada, id]
          );
        } else {
          let diferencia;
          if (asientosAsignados > viajeActual[0].asientos_asignados) {
            diferencia = asientosAsignados - viajeActual[0].asientos_asignados;
            await pool.query(
              "UPDATE viaje SET ruta=?, fecha_salida=?, hora_salida=?, fecha_llegada=?, hora_llegada=?, asientos_asignados=?, asientos_disponibles=asientos_disponibles+?, combi=?, fecha_publicacion=?, precio=? WHERE id_viaje=?",
              [ruta, fechasalida, horasalida, fechallegada, horallegada, asientosAsignados, diferencia, combi, fechapublicacion, precio, id]
            );
          } else {
            diferencia = viajeActual[0].asientos_asignados - asientosAsignados;
            await pool.query(
              "UPDATE viaje SET ruta=?, fecha_salida=?, hora_salida=?, fecha_llegada=?, hora_llegada=?, asientos_asignados=?, asientos_disponibles=asientos_disponibles-?, combi=?, fecha_publicacion=?, precio=? WHERE id_viaje=?",
              [ruta, fechasalida, horasalida, fechallegada, horallegada, asientosAsignados, diferencia, combi, fechapublicacion, precio, id]
            );
          }
        }

        await pool.query(
          "UPDATE viaje SET ruta=?,fecha_salida=?,hora_salida=?,combi=?,fecha_publicacion=?,precio=?,fecha_llegada=?,hora_llegada=? WHERE id_viaje=?",
          [ruta, fechasalida, horasalida, combi, fechapublicacion, precio, fechallegada, horallegada, id]
        );
      }
    }
    res.send(errors);
  });


router.delete("/insumoViaje/eliminar", isAdmin, async (req, res) => {
  const { id } = req.body;
  const result = await pool.query("SELECT * FROM viaje_insumos WHERE id_viajeinsumos=?", [id]);
  const resultInsumo = await pool.query("SELECT * FROM insumo WHERE id_insumo=?", [result[0].insumo]);
  const cantidadActualizada = resultInsumo[0].cantidad + result[0].cantidad;
  await pool.query("UPDATE insumo SET cantidad=? WHERE id_insumo=?", [cantidadActualizada, result[0].insumo]);
  await pool.query("DELETE FROM viaje_insumos WHERE id_viajeinsumos=?", [id]);
  res.json({
    value: result[0].viaje,
    result: true,
    message: "Se ha eliminado el insumo del viaje exitosamente!"
  });
});

router.delete("/viajes/eliminar", isAdmin, async (req, res) => {
  const { id } = req.body;
  const result = await pool.query("SELECT * FROM viaje WHERE id_viaje=?", [id]);
  if (result.length > 0) {
    const viajes_vendidos = await pool.query("SELECT * FROM usuario_viaje WHERE viaje=?", [id]);
    let viaje_concretado=false
    for (let i = 0; i < viajes_vendidos.length; i++) {   //este for recorre todos los pasajes preguntado si esta concretado ya q puede q algunos esten cancelados 
      if(viajes_vendidos[0].estado == "CONCRETADO"){
        viaje_concretado=true
        break
      }
    }
    if (viaje_concretado || viajes_vendidos.length == 0) {
    const resultInsumos = await pool.query("SELECT * FROM viaje_insumos WHERE viaje=?", [id]);
    for (let index = 0; index < resultInsumos.length; index++) {
      var insumo = await pool.query("SELECT * FROM insumo WHERE id_insumo=?", [resultInsumos[index].insumo]);
      await pool.query('UPDATE insumo SET cantidad=? WHERE id_insumo=?', [(insumo[0].cantidad + resultInsumos[index].cantidad), resultInsumos[index].insumo]);
    }
    if (resultInsumos.length > 0) {
      await pool.query("DELETE FROM viaje_insumos WHERE viaje=?", [id]);
    }
    await pool.query("DELETE FROM comentarios WHERE viaje=?", [id]);
    await pool.query("DELETE FROM usuario_viaje WHERE viaje=?", [id]);
    await pool.query("DELETE FROM viaje WHERE id_viaje=?", [id]);
    res.json({
      result: true,
      message: "Se ha eliminado el viaje exitosamente!",
    });}
    else{
      res.json({
        result: false,
        message: "No se puede eliminar este viaje dado que ya tiene pasajes vendidos!",
      });
    }
  } else {
    res.json({
      result: false,
      message: "No se puede eliminar este viaje dado que no existe!",
    });
  }
});

//---------------------------------------------------------------------------------------------------FIN DE VIAJES-------------------------------------------------------------------------------------


//---------------------------------------------------------------------------------------------------RUTAS-------------------------------------------------------------------------------------
router.get("/rutas", isAdmin, async (req, res) => {
  const key = req.user.img;
  const lugares = await pool.query("SELECT * FROM lugar");
  res.render("admin/rutas", { lugares, key });
});

router.post("/ruta/lugar", async (req, res) => {
  const { lugar } = req.body;
  const result = await pool.query("SELECT * FROM lugar WHERE nombre=?", [lugar]);
  if (result.length > 0) {
    res.json(true);
  } else {
    res.json(false);
  }
});

// POST DE RUTAS
router.post("/rutas",
  body('origen').custom(async (value) => {
    const result = await pool.query("SELECT * FROM lugar WHERE nombre=?", [value]);
    if (result.length == 0) {
      throw new Error("Lo siento, no existe el origen en el sistema!");
    }
  }),
  body('destino').custom(async (value) => {
    const result = await pool.query("SELECT * FROM lugar WHERE nombre=?", [value]);
    if (result.length == 0) {
      throw new Error("Lo siento, no existe el destino en el sistema!");
    }
  }),
  async (req, res) => {
    var { id, origen, destino } = req.body;
    const result = validationResult(req);
    const errors = result.errors;
    const resultOrigen = await pool.query("SELECT * FROM lugar WHERE nombre=?", origen);
    const resultDestino = await pool.query("SELECT * FROM lugar WHERE nombre=?", destino);
    if (resultOrigen.length > 0 && resultDestino.length > 0) {
      const resultRuta = await pool.query("SELECT * FROM ruta WHERE origen=? AND destino=?", [resultOrigen[0].id_lugar, resultDestino[0].id_lugar]);
      if (resultRuta.length > 0) {
        errors.push({
          value: '',
          msg: 'La ruta ya existe en el sistema!',
          param: 'ruta',
          location: 'body'
        });
      }
    }
    if (errors.length == 0) {
      if (id == "") {
        await pool.query("INSERT INTO ruta (origen, destino) VALUES (?,?)", [resultOrigen[0].id_lugar, resultDestino[0].id_lugar]);
      } else {
        await pool.query("UPDATE ruta SET origen=?,destino=? WHERE id_ruta=?", [resultOrigen[0].id_lugar, resultDestino[0].id_lugar, id]);
      }
    }
    res.send(errors);
  });

router.post("/ruta/editar", isAdmin, async (req, res) => {
  const { id } = req.body;
  const result = await pool.query("SELECT * FROM viaje WHERE ruta=?", [id]);
  if (result.length > 0) {
    res.json({ result: false, message: 'No es posible editar la ruta, ya que la misma tiene viaje/s asignado/s!' });
  } else {
    res.json({ result: true });
  }
})

router.delete("/rutas/eliminar", isAdmin, async (req, res) => {
  const { id } = req.body;
  const result = await pool.query("SELECT * FROM viaje WHERE ruta=?", [id]);
  if (result.length > 0) {
    res.json({ result: false, message: 'No es posible eliminar la ruta, ya que la misma tiene viaje/s asignado/s!' });
  } else {
    await pool.query("DELETE FROM ruta WHERE id_ruta=?", [id]);
    res.json({ result: true, message: "La ruta se ha eliminado existosamente!" });
  }
})

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

  res.redirect("/admin/rutas");
});

router.get("/rutasJSON", isAdmin, async (req, res) => {
  const aux = await pool.query(
    "SELECT r.id_ruta AS id_ruta, l.nombre AS origen, l2.nombre AS destino FROM ruta r INNER JOIN lugar l ON ( r.origen = l.id_lugar ) INNER JOIN lugar l2 ON ( r.destino = l2.id_lugar ) ORDER BY id_ruta"
  );
  res.send(aux);
});
//---------------------------------------------------------------------------------------------------FIN DE RUTAS-------------------------------------------------------------------------------------

// Aca exporto el enrutador:
module.exports = router;