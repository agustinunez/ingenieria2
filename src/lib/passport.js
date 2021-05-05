const passport = require('passport');
const pool = require('../database');
const LocalStrategy = require('passport-local').Strategy;
const helpers = require('./helpers');

passport.use(
    "local.signin",
    new LocalStrategy({
            usernameField: "username",
            passwordField: "password",
            passReqToCallback: true,
        },
        async(req, username, password, done) => {
            const rows = await pool.query("SELECT * FROM usuario WHERE username = ?", [
                username
            ]);
            if (rows.length > 0) {
                const user = rows[0];
                const validPassword = await helpers.matchPassword(
                    password,
                    user.password
                );
                if (validPassword) {
                    done(null, user, req.flash("success", "Bienvenido " + user.username + "!"));
                } else {
                    done(null, false, req.flash("warning", "Nombre de usuario o contraseña invalido!"));
                }
            } else {
                return done(
                    null,
                    false,
                    req.flash("warning", "Nombre de usuario o contraseña invalido!")
                );
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id_usuario);
});

passport.deserializeUser(async(id, done) => {
    const rows = await pool.query("SELECT * FROM usuario WHERE id_usuario = ?", [id]);
    done(null, rows[0]);
});