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
    //Validaciones de registro de usuario.
    body('name').notEmpty().withMessage('El campo "Nombre" no puede estar vacio!'),
    body('lastname').notEmpty().withMessage('El campo "Apellido" no puede estar vacio!'),
    body('birthdate').custom((value, { req }) => {
        if (!value) {
            throw new Error('El campo "Fecha de nacimiento" no puede estar vacio!');
        } else {
            let userBirthdate = new Date(value);
            let d = new Date();
            let year = d.getFullYear();
            let month = d.getMonth();
            let day = d.getDate();
            let cA = new Date(year - 18, month, day);
            if (userBirthdate > cA) {
                throw new Error('Debe ser mayor de 18 años!');
            }
        }
        return true;
    }),
    body('email').isEmail().withMessage('Formato de email invalido!'),
    body('email').custom(async (value, { req }) => {
        const result = await pool.query('SELECT email FROM usuario WHERE email=?', [value]);
        if (result.length > 0) {
            throw new Error('El email ' + value + ' ya se encuentra en uso!');
        }
    }),
    body('username').notEmpty().withMessage('El campo "Nombre de usuario" no puede estar vacio!'),
    body('username').custom(async (value) => {
        const result = await pool.query('SELECT username FROM usuario WHERE username=?', [value]);
        if (result.length > 0) {
            throw new Error('El nombre de usuario ' + value + ' ya se encuentra en uso!');
        }
    }),
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
        return res.render('auth/signup', {user, errors});
    }
    await pool.query('INSERT INTO usuario SET ?', [user]);
    res.redirect('/login');
})


// Aca exporto el enrutador

module.exports = router;