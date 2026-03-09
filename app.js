const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');


const app = express();
const PORT = 3000;

// Motor de vistas
app.set('view engine', 'ejs');
app.set('views', ',/views');

// middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('views'));

app.use(session({
    secret: 'mi-secreto',
    resave: false,
    saveUninitialized: true
}));

// rutas
app.use('/', require('./routes/auth.routes'));
app.use('/', require('./routes/ftp.routes'));
app.use('/', require('./routes/crud.routes'));

// server
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
