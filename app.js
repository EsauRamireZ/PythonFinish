const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = 3000;

// middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('views'));

app.use(session({
    secret: 'mi-secreto',
    resave: false,
    saveUninitialized: true
}));

// rutas
app.use('/', require('./routes/auth.routes'));

// server
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
