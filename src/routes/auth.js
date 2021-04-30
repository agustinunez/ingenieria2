// Constantes

const express = require('express');
const router = express.Router();
const pool = require('../database');
const { body, validationResult } = require('express-validator');

//Aca va, todo lo que yo quiera que pase si en el buscador pongo /algo
router.get('/login', (req,res)=>{
    res.render('auth/login');
})

router.get('/signup', (req,res)=>{
    res.render('auth/signup');
})

router.post('/login', (req,res)=>{
    res.send('recibido');
})

router.post('/signup', 
    body('name').notEmpty().withMessage('El campo "Nombre" no puede estar vacio!'),
    body('lastname').notEmpty().withMessage('El campo "Apellido" no puede estar vacio!'),
    body('birthdate').notEmpty().withMessage('El campo "Fecha de nacimiento" no puede estar vacio!'),
    body('email').isEmail().withMessage('Formato de email invalido!'),
    body('username').notEmpty().withMessage('El campo "Nombre de usuario" no puede estar vacio!'),
    body('password').isLength({ min: 7 }).withMessage('La contraseña debe ser mayor a 6 caracteres!'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('La confirmacion de la contraseña no coincide con la contraseña!');
        }
    
        // Indicates the success of this synchronous custom validator
        return true;
    }),

    async (req,res)=>{
    
    const { name, lastname, birthdate, email, username, password, plan } = req.body;
    const user = {
        name,
        lastname,
        birthdate,
        email,
        username,
        password,
        plan
    }
    const result = validationResult(req);
    const errors = result.errors;
    if (!result.isEmpty()) {
        console.log(errors);
        return res.render('auth/signup', {user, errors});
    }
    await pool.query('INSERT INTO usuario SET ?', [user]);
    console.log(user);
    res.redirect('/login');
})


// Aca exporto el enrutador

module.exports = router;