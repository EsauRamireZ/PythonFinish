const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Necesario para Render
app.set('trust proxy', 1);

// Sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'mi-secreto',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));

// Página principal
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Bienvenido</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f4f4f4;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .box {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            width: 300px;
            box-shadow: 0 4px 8px rgba(0,0,0,.2);
        }
        button {
            padding: 10px 20px;
            border: none;
            background: #007bff;
            color: white;
            border-radius: 5px;
            cursor: pointer;
        }
        button:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <div class="box">
        <h1>Hola a todos</h1>
        <p>Bienvenidos a Express JS</p>
        <form action="/formulario" method="GET">
            <button type="submit">Iniciar sesión</button>
        </form>
    </div>
</body>
</html>
    `);
});

// Formulario
app.get('/formulario', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Formulario</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f4f4f4;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .box {
            background: white;
            padding: 20px;
            border-radius: 10px;
            width: 300px;
            box-shadow: 0 4px 8px rgba(0,0,0,.2);
        }
        input {
            width: 100%;
            padding: 8px;
            margin: 10px 0;
        }
        button {
            width: 100%;
            padding: 10px;
            border: none;
            background: #007bff;
            color: white;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="box">
        <form action="/guardar-datos" method="POST">
            <label>Nombre</label>
            <input type="text" name="nombre" required>

            <label>Apellido</label>
            <input type="text" name="apellido" required>

            <button type="submit">Siguiente</button>
        </form>
    </div>
</body>
</html>
    `);
});

// Guardar datos
app.post('/guardar-datos', (req, res) => {
    const { nombre, apellido } = req.body;
    req.session.nombre = nombre;
    req.session.apellido = apellido;
    res.redirect('/mostrar-datos');
});

// Mostrar datos
app.get('/mostrar-datos', (req, res) => {
    if (!req.session.nombre || !req.session.apellido) {
        return res.redirect('/');
    }

    res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Resultado</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f4f4f4;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .box {
            background: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 8px rgba(0,0,0,.2);
        }
        a {
            display: inline-block;
            margin-top: 15px;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="box">
        <h1>Tu nombre es</h1>
        <h2>${req.session.nombre} ${req.session.apellido}</h2>
        <a href="/">Regresar</a>
    </div>
</body>
</html>
    `);
});

// Servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});