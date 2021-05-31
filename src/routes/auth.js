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
const { encryptPassword } = require('../lib/helpers');

//Aca va, todo lo que yo quiera que pase si en el buscador pongo /algo
router.get('/login', isLoggedIn, (req, res) => {
    res.render('auth/login');
})

router.get('/signup', isLoggedIn, (req, res) => {
    res.render('auth/signup');
})

router.get('/forgotPassword', isLoggedIn, (req, res) => {
    res.render('auth/forgotPassword');
})

router.post('/forgotPassword', isLoggedIn, (req, res) => {
    const { email } = req.body;

    const randomCode = Math.floor(Math.random() * 89999) + 10000;
    const mailSubject = "Codigo de verificacion";
    const content = `
        <img src="https://i.ibb.co/V3gnkDd/logoTest.png" width="273" height="82.6">
        <div style="text-align: center;">
            <img src="https://cdn.icon-icons.com/icons2/1845/PNG/512/yellowlike_116080.png" width="150" height="150">
            <p style="font-size: 1.1rem">Hola!</p>
            <p style="font-size: 1.1rem">Aqui esta el codigo de verificacion:</p>
            <h1 style="margin: .5rem auto; font-size: 3rem; font-weight: 800;">${randomCode}</h1>
            <p style="font-size: 1.1rem">Todo lo que tienes que hacer es ingresar el codigo en la pagina para continuar con el proceso de reestablecer su contraseña.</p>
            <div style="text-align: center; background-color: #edf1f6; padding: .8rem 0">
                <span style="display: block; font-size: .9rem;">¿No fuiste tu? Si no fuiste tu ignora este mensaje.</span>
                <span style="display: block; margin-top: .3rem; font-size: .9rem;">&copy; Equipo Combi-19. Todos los derechos reservados.</span>
            </div>
        </div>
    `
    helpers.sendMail(content, mailSubject, email)
        .then(result => res.status(200).send({randomCode}))
        .catch(error => console.log(error.message))
    // const contentHTML = `
    //     <img src="https://i.ibb.co/V3gnkDd/logoTest.png" width="273" height="82.6">
    //     <div style="text-align: center;">
    //         <img src="https://cdn.icon-icons.com/icons2/1845/PNG/512/yellowlike_116080.png" width="150" height="150">
    //         <p style="font-size: 1.1rem">Hola!</p>
    //         <p style="font-size: 1.1rem">Aqui esta el codigo de verificacion:</p>
    //         <h1 style="margin: .5rem auto; font-size: 3rem; font-weight: 800;">${randomCode}</h1>
    //         <p style="font-size: 1.1rem">Todo lo que tienes que hacer es ingresar el codigo en la pagina para continuar con el proceso de reestablecer su contraseña.</p>
    //         <div style="text-align: center; background-color: #edf1f6; padding: .8rem 0">
    //             <span style="display: block; font-size: .9rem;">¿No fuiste tu? Si no fuiste tu ignora este mensaje.</span>
    //             <span style="display: block; margin-top: .3rem; font-size: .9rem;">&copy; Equipo Combi-19. Todos los derechos reservados.</span>
    //         </div>
    //     </div>
    // `

    // const CLIENT_ID = "125203151603-0ivipfkf95b21id2lv1dgvcvm2qg1feq.apps.googleusercontent.com";
    // const CLIENT_SECRET = "fzUL8J_BFQG2UqixXDmI15wO";
    // const REDIRECT_URI = "https://developers.google.com/oauthplayground";
    // const REFRESH_TOKEN = "1//04o2J6CZNZwQaCgYIARAAGAQSNwF-L9Irq2e0wRCm5X2MEFKMWtUsvXdLnj6LNHe0DWsla58UdxKJxMql8KJQIirrBnU6by6Kn14";

    // const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    // oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    // async function sendMail() {
    //     try {
    //         const accessToken = await oAuth2Client.getAccessToken();
    //         const transporter = nodemailer.createTransport({
    //             service: "gmail",
    //             auth: {
    //                 type: "OAuth2",
    //                 user: "enterprise.combi19@gmail.com",
    //                 clientId: CLIENT_ID,
    //                 clientSecret: CLIENT_SECRET,
    //                 refreshToken: REFRESH_TOKEN,
    //                 accessToken: accessToken
    //             }
    //         });
    //         const mailOptions = {
    //             from: "Equipo Combi-19 <enterprise.combi19@gmail.com>",
    //             to: email,
    //             subject: "Codigo de verificacion",
    //             html: contentHTML
    //         };

    //         const result = await transporter.sendMail(mailOptions)
    //         return result
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }
    // sendMail()
    //     .then(result => res.status(200).send({randomCode}))
    //     .catch(error => console.log(error.message))
});

router.post('/newPasswordMail', isLoggedIn, async (req, res) => {
    const { email } = req.body;
    const randomPassword = helpers.getRandomString(8);

    const encryptedPassword = await helpers.encryptPassword(randomPassword);
    await pool.query("UPDATE usuario SET password=? WHERE email=?", [encryptedPassword, email]);

    const mailSubject = "Reinicio de contraseña";
    const content = `
        <img src="https://i.ibb.co/V3gnkDd/logoTest.png" width="273" height="82.6">
        <div style="text-align: center;">
            <img src="https://cdn.icon-icons.com/icons2/1732/PNG/512/iconfinder-securityprotectlockshield20-4021466_113124.png" width="150" height="150">
            <p style="font-size: 1.1rem">Hola!</p>
            <p style="font-size: 1.1rem">Aqui esta la nueva contraseña:</p>
            <h1 style="margin: .5rem auto; font-size: 3rem; font-weight: 800;">${randomPassword}</h1>
            <p style="font-size: 1.1rem">Todo lo que tienes que hacer es iniciar sesion con la nueva contraseña de arriba, y luego podras cambiarla sin problemas en tu perfil.</p>
            <div style="text-align: center; background-color: #edf1f6; padding: .8rem 0">
                <span style="display: block; font-size: .9rem;">¿No fuiste tu? Si no fuiste tu ignora este mensaje.</span>
                <span style="display: block; margin-top: .3rem; font-size: .9rem;">&copy; Equipo Combi-19. Todos los derechos reservados.</span>
            </div>
        </div>
    `
    helpers.sendMail(content, mailSubject, email)
        .then(result => res.status(200).send(true))
        .catch(error => console.log(error.message))
})

router.post('/codeValidation', isLoggedIn, (req, res) => {
    const { inputSwal1, inputSwal2, inputSwal3, inputSwal4, inputSwal5, randomCode } = req.body;
    if (inputSwal1 == '' || inputSwal2 == '' || inputSwal3 == '' || inputSwal4 == '' || inputSwal5 == '') {
        res.send({ok: false, message: 'Debe completar todos los campos!'});
        return;
    }
    const concatenation = inputSwal1 + inputSwal2 + inputSwal3 + inputSwal4 + inputSwal5;
    if (concatenation !== randomCode) {
        res.send({ok: false, message: 'El codigo es incorrecto!'});
        return;
    }
    res.send({ok: true});
})

router.post('/forgotPasswordValidEmail',     
    body('email').notEmpty().withMessage("Debes ingresar tu email!"),
    body('email').custom(async (value) => {
        if (value != '') {
            const result = await pool.query("SELECT * FROM usuario WHERE email=?", [value]);
            if (result.length == 0) {
                throw new Error("Lo siento, el email no existe en el sistema!");
            }
        }
    }),
    isLoggedIn, (req, res) => {
        const result = validationResult(req);
        const errors = result.errors;
    
        res.send(errors);
})

router.post('/login', function(req,res,next){
    const {username,password} = req.body;
    if (username=='' || password==''){
        req.flash('warning','Nombre de usuario o contraseña invalido!');
    }
    return next();
} ,passport.authenticate('local.signin', {
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