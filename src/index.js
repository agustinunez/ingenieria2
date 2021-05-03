// Constantes 

const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const flash = require('connect-flash');
const path = require('path');
const passport = require('passport');

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
    extname: '.hbs'
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

app.use((req, res, next) => {
    app.locals.warning = req.flash("warning");
    app.locals.success = req.flash("success");
    app.locals.user = req.user;
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