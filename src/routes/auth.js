// Constantes
const express = require('express');
const router = express.Router();
const pool = require('../database');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const helpers = require('../lib/helpers');
const payform = require('payform');
const { isLoggedIn} = require('../lib/auth');
const { ROLE } = require('../lib/roles');
const { isAdmin } = require('../lib/auth');


//Aca va, todo lo que yo quiera que pase si en el buscador pongo /algo
router.get('/login', isLoggedIn, (req, res) => {
    res.render('auth/login');
})

router.get('/signup', isLoggedIn, (req, res) => {
    res.render('auth/signup');
})

router.post('/login', passport.authenticate('local.signin', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

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

    // Esto deberia estar despues de que me lleguen los datos
    body('plan').custom((value, { req }) => {
        if (value === 'gold') {
            if (req.body.owner == '') {
                throw new Error('El campo "Nombre del titular" no puede estar vacio!')
            }
            return true
        }
        return true
    }),
    body('plan').custom((value, { req }) => {
        if (value === 'gold') {
            if (!payform.validateCardNumber(req.body.cardnumber)) {
                throw new Error('Numero de tarjeta invalido!')
            }
            return true
        }
        return true
    }),
    body('plan').custom((value, { req }) => {
        if (value === 'gold') {
            if (!payform.validateCardCVC(req.body.cvv)) {
                throw new Error('CVV invalido!')
            }

            return true
        }
        return true
    }),
    body('plan').custom((value, { req }) => {
        if (value === 'gold') {
            const cardDate = payform.parseCardExpiry(req.body.expireddate);
            if (!payform.validateCardExpiry(cardDate.month, cardDate.year)) {
                throw new Error('Fecha de expiracion invalida!')
            }
            return true
        }
        return true
    }),

    async (req, res) => {

        const { name, lastname, birthdate, email, username, password, plan } = req.body;
        userInfo = {
            name,
            lastname,
            birthdate,
            email,
            username,
            password,
            plan
        }

        if (plan == 'gold') {
            const { owner, cardnumber, cvv, expireddate } = req.body;
            userInfo.owner = owner;
            userInfo.cardnumber = cardnumber;
            userInfo.cvv = cvv;
            userInfo.expireddate = expireddate;
        }


        const result = validationResult(req);
        const errors = result.errors;
        if (!result.isEmpty()) {
            return res.render('auth/signup', { userInfo, errors });
        }
        userInfo.password = await helpers.encryptPassword(userInfo.password);
        userInfo.username = userInfo.username;
        const row = await pool.query('INSERT INTO usuario SET ?', [userInfo]);
        const autoridad = {
            rol: ROLE.COMUN,
            id_usuario: row.insertId
        };
        await pool.query('INSERT INTO autoridad SET ?', [autoridad]);
        //row.insertId
        req.flash('success', 'Se ha realizado el registro exitosamente!')
        res.redirect('/login');
    })


router.get('/logout', (req, res) => {
    req.logOut();
    req.flash('success', 'Se ha cerrado sesion con exito!');
    res.redirect('/login');
})
// Aca exporto el enrutador

module.exports = router;