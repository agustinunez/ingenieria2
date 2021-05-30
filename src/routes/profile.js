// Constantes

const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const { hasPermission } = require("../lib/auth");
var dateFormat = require("dateformat");
const pool = require('../database');
const helpers = require('../lib/helpers');
const payform = require('payform');

router.get('/',hasPermission, (req, res) => {
    const user = req.user;
    user.birthdate= dateFormat(user.birthdate, "yyyy-mm-dd");
    const username = user.username.toUpperCase();
    const plan = req.user.plan.toUpperCase();
    res.render("perfil", {user, username, plan});
});

router.post('/getCard', hasPermission, async (req,res) => {
    const { id } = req.body;
    var result = await pool.query("SELECT cardnumber FROM usuario WHERE id_usuario=?",[id]);
    result = result[0].cardnumber.slice(-4);
    res.send(result);
})

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

// router.post('/editarContrasena/contrasenanueva', hasPermission, async (req,res) => {
//     const {nuevacontraseñaValue , idValue} = req.body;
//     if (nuevacontraseñaValue.length( { min: 7}) < 6){
//         res.json(false);
//     }else{
//         res.json(true);
//     }
// });

router.post('/editarContrasena/confirmarcontrasena', hasPermission, async (req,res) => {
    const {confirmarcontraseñaValue, contraseñanuevaValue} = req.body;
    if (contraseñanuevaValue != confirmarcontraseñaValue){
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

router.put('/editarContrasena',
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
    const contraseña = await helpers.matchPassword(contraseñavieja,oldPassowrd[0].password)
    if ( !contraseña ){
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
    res.send(errors);
})

router.put('/editPassword', hasPermission, async (req,res) => {
  var { contraseñanueva, id } = req.body;
  contraseñanueva = await helpers.encryptPassword(contraseñanueva);
  await pool.query("UPDATE usuario SET password=? WHERE id_usuario=?", [contraseñanueva, id]);
});


// ............EDITAR PLAN............

router.post('/editarPlan/cardnumber', hasPermission, (req,res) => {
  const {cardnumberValue} = req.body;
    if (!payform.validateCardNumber(cardnumberValue)){
        res.json(false);
    }else{
        res.json(true);
    }
});

router.post('/editarPlan/cvv', hasPermission, (req,res) => {
  const {cvvValue} = req.body;
    if (!payform.validateCardCVC(cvvValue)){
        res.json(false);
    }else{
        res.json(true);
    }
});

router.post('/editarPlan/expireddate', hasPermission, (req,res) => {
  const {expireddateValue} = req.body;
  const cardDate = payform.parseCardExpiry(expireddateValue);
  if (!payform.validateCardExpiry(cardDate.month, cardDate.year)) {
        res.json(false);
    }else{
        res.json(true);
    }
});

router.post(
  "/editarPlan",
  body("owner").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("cardnumber").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("cardnumber").custom( async (value) => {
    if (!payform.validateCardNumber(value)) {
      throw new Error("Numero de tarjeta invalido!");
    }
  }),
  body("cvv").notEmpty().withMessage("Este campo no puede estar vacio!"),
  body("cvv").custom( async (value) => {
    if (!payform.validateCardCVC(value)) {
      throw new Error("CVV invalido!");
    }
  }),
  body("expireddate")
    .notEmpty()
    .withMessage("Este campo no puede estar vacio!"),
  body("expireddate").custom( async (value) => {
    const cardDate = payform.parseCardExpiry(value);
    if (!payform.validateCardExpiry(cardDate.month, cardDate.year)) {
      throw new Error("Fecha de expiracion invalido!");
    }
  }),
  hasPermission,
  (req, res) => {

    const { owner, cardnumber, cvv, expireddate, id } = req.body;
    const result = validationResult(req);
    const errors = result.errors;

    res.send(errors);
  
  });

router.put('/editPlanToGold', hasPermission, async (req,res) => {
  var { owner, cardnumber, cvv, expireddate, id } = req.body;
  await pool.query("UPDATE usuario SET plan=?,owner=?,cardnumber=?,cvv=?,expireddate=? WHERE id_usuario=?", ['gold',owner, cardnumber, cvv, expireddate, id]);
});

router.put('/editPlanToBasic', hasPermission, async (req,res) => {
  var { id } = req.body;
  await pool.query("UPDATE usuario SET plan=?,owner=?,cardnumber=?,cvv=?,expireddate=? WHERE id_usuario=?", ['basico',null, null, null, null, id]);
});


// Aca exporto el enrutador

module.exports = router;