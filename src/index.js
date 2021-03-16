// Constantes 

const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');

//Inicializar

const app = express();

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

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//Variables globales

app.use((req, res, next) => {

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