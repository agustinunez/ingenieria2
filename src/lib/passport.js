const passport = require('passport');
const pool = require('../database');
const LocalStrategy = require('passport-local').Strategy;
const helpers = require('./helpers');

//Falta arreglar cuando se loguea con un usuario y contraseña correcta, que serialice bien.
passport.use(
    "local.signin",
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, username, password, done) => {
        const rows = await pool.query("SELECT * FROM usuario WHERE username = ?", [
          username,
        ]);
        if (rows.length > 0) {
          const user = rows[0];
          const validPassword = await helpers.matchPassword(
            password,
            user.password
          );
          if (validPassword) {
            done(null, user);
          } else {
            done(null, false);
          }
        } else {
          return done(
            null,
            false
          );
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id, done) => {
    const rows = await pool.query("SELECT * FROM usuario WHERE id = ?", [id]);
    done(null, rows[0]);
  });