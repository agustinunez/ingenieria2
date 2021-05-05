// Constantes 

const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const flash = require('connect-flash');
const path = require('path');
const passport = require('passport');
const pool = require('./database');

//Inicializar

const app = express();
require('./lib/passport');

//Settings

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: {
        selectedIfEqual: function(val1, val2) {
            if (val1 === val2) {
                return "selected"
            } else {
                return ""
            }
        }
    }
}))
app.set('view engine', '.hbs');

//Midlewares
app.use(
    session({
        secret: "ingenieria2",
        resave: false,
        saveUninitialized: false
    })
);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//Variables globales

app.use (async (req, res, next) => {
    app.locals.warning = req.flash("warning");
    app.locals.success = req.flash("success");
    app.locals.user = req.user;
    if (req.isAuthenticated()) {
        app.locals.userRol = await pool.query('SELECT * FROM autoridad WHERE id_usuario=?', [req.user.id_usuario]);
        app.locals.result = app.locals.userRol[0].rol
    }
    next();
});



//Routes

app.use(require('./routes/home'));
app.use('/links', require('./routes/links'));
app.use(require('./routes/auth'));

//Public

app.use(express.static(path.join(__dirname, 'Public')));

//Starting server
app.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
});

// Finish