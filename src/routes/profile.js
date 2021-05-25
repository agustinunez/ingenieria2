// Constantes

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { hasPermission } = require("../lib/auth");
var dateFormat = require("dateformat");
const pool = require('../database');
const helpers = require('../lib/helpers');

router.get('/',hasPermission, (req, res) => {
    const user = req.user;
    user.birthdate= dateFormat(user.birthdate, "yyyy-mm-dd");
    const username = user.username.toUpperCase();
    res.render("perfil", {user, username});
});

router.post('/editarPerfil/username', hasPermission, async (req,res) => {
    const { nombreDeUsuarioValue,idValue } = req.body;
    const auxUser = await pool.query("SELECT * FROM usuario WHERE username=?",[nombreDeUsuarioValue]);
    if ( auxUser.length > 0 ){
        if (auxUser[0].id_usuario == idValue) {
            res.json(true);
          } else {
            res.json(false);
          }
        } else {
          res.json(true);
        }
});

router.post('/editarPerfil/email', hasPermission, async (req,res) => {
    const { emailValue,idValue } = req.body;
    const auxUser = await pool.query("SELECT * FROM usuario WHERE email=?",[emailValue]);
    if ( auxUser.length > 0 ){
        if (auxUser[0].id_usuario == idValue) {
            res.json(true);
          } else {
            res.json(false);
          }
        } else {
          res.json(true);
        }
});

router.post('/editarPerfil/birthdate', hasPermission, (req,res) => {
    const {fechadenacimientoValue,idValue } = req.body;
    let userBirthdate = new Date(fechadenacimientoValue);
    let d = new Date();
    let year = d.getFullYear();
    let month = d.getMonth();
    let day = d.getDate();
    let cA = new Date(year - 18, month, day);
    if (userBirthdate > cA) {
        res.json(false);
    }else{
        res.json(true);
    }
});


router.post('/editarContrasena/contrasenavieja', hasPermission, async (req,res) => {
    const {contraseñaValue , idValue} = req.body;
    const aux = await pool.query("SELECT * FROM usuario WHERE id_usuario=?",[idValue]);
    const contraseña = await helpers.matchPassword(contraseñaValue,aux[0].password)
    if ( contraseña ){
        res.json(true);
    }else{
        res.json(false);
    }
});

router.post('/editarContrasena/contrasenanueva', hasPermission, async (req,res) => {
    const {nuevacontraseñaValue , idValue} = req.body;
    if (nuevacontraseñaValue.length < 6){
        res.json(false);
    }else{
        res.json(true);
    }
});

router.post('/editarContrasena/confirmarcontrasena', hasPermission, async (req,res) => {
    const {confirmarcontraseñaValue, nuevacontraseñaValue} = req.body;
    if (nuevacontraseñaValue != confirmarcontraseñaValue){
        res.json(false);
    }else{
        res.json(true);
    }
});


router.post('/editarPerfil', 
body("nombredeusuario").notEmpty().withMessage("Este campo no puede estar vacio!"),
body("apellido").notEmpty().withMessage("Este campo no puede estar vacio!"),
body("nombre").notEmpty().withMessage("Este campo no puede estar vacio!"),
body("email").notEmpty().withMessage("Este campo no puede estar vacio!"),
body("fechadenacimiento").notEmpty().withMessage("Este campo no puede estar vacio!"),
body("fechadenacimiento").custom(async (value) => {
    let userBirthdate = new Date(value);
    let d = new Date();
    let year = d.getFullYear();
    let month = d.getMonth();
    let day = d.getDate();
    let cA = new Date(year - 18, month, day);
    if (userBirthdate > cA) {
      throw new Error("Lo siento, debe ser mayor a 18 años!");
    }
}),
hasPermission, async (req,res) => {
    var { id, nombredeusuario, apellido, nombre, email, fechadenacimiento } = req.body;
    const result = validationResult(req);
    const errors = result.errors;

    // No me valida al momento de poner el Guardar

    // No me valida que la contraseña nueva es igual al confirmar contraseña


    const resultUsername = await pool.query("SELECT * FROM usuario WHERE username=?", [nombredeusuario]);
    if (resultUsername.length > 0) {
      if (resultUsername[0].id_usuario != id) {
        errors.push({
          value: '',
          msg: 'Lo siento, el Nombre de Usuario ya existe en el sistema!',
          param: 'nombredeusuario',
          location: 'body'
        });
      }
    }
    const resultEmail = await pool.query("SELECT * FROM usuario WHERE email=?", [email]);
    if (resultEmail.length > 0) {
      if (resultEmail[0].id_usuario != id) {
        errors.push({
          value: '',
          msg: 'Lo siento, el Email ya existe en el sistema!',
          param: 'email',
          location: 'body'
        });
      }
    }
    if (errors.length == 0) {
        await pool.query("UPDATE usuario SET username=?,lastname=?,name=?,email=?, birthdate=? WHERE id_usuario=?", [nombredeusuario, apellido, nombre, email, fechadenacimiento, id]);
    }
    res.send(errors);
});

router.post('/editarContraseña',
body("contraseñavieja").notEmpty().withMessage("Este campo no puede estar vacio!"),
body("contraseñanueva").notEmpty().withMessage("Este campo no puede estar vacio!"),
body("contraseñanueva").custom(async (value) => {
    if (value.length < 6){
        throw new Error("Lo siento, la Contraseña debe ser mayor a 6 digitos!");
    }
}),
body("confirmarcontraseña").notEmpty().withMessage("Este campo no puede estar vacio!"),

hasPermission, async(req,res) => {
    var { id, contraseñavieja, contraseñanueva, confirmarcontraseña } = req.body;
    const result = validationResult(req);
    const errors = result.errors;

    const oldPassowrd = await pool.query("SELECT * FROM usuario WHERE id_usuario=?", [id]);
      if (oldPassowrd[0].password != contraseñavieja) {
        errors.push({
          value: '',
          msg: 'Lo siento, la Contraseña no coincide con la anterior!',
          param: 'contraseñavieja',
          location: 'body'
        });
    }
      if (contraseñanueva != confirmarcontraseña) {
        errors.push({
          value: '',
          msg: 'Lo siento, la Contraseña no coincide con la anteriormente ingresada!',
          param: 'confirmarcontraseña',
          location: 'body'
        });
    }

    if (errors.length == 0) {
        await pool.query("UPDATE usuario SET password=? WHERE id_usuario=?", [contraseñanueva, id]);
    }
    res.send(errors);
})

// Aca exporto el enrutador

module.exports = router;