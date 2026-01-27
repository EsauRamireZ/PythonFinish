const express = require('express');
const router = express.Router();
const { sql, pool } = require('../config/db');
const axios = require('axios');

// home para login
router.get('/', (req, res) => {
    res.sendFile('home.html', { root: 'views' });
});

// formulario registro
router.get('/formulario', (req, res) => {
    res.sendFile('formulario.html', { root: 'views' });
});

// registro
router.post('/registro', async (req, res) => {
    const { nombre, apPaterno, apMaterno, correo, contrasenia } = req.body;

    try {
        const connection = await pool;

        const result = await connection.request()
            .input('nombre', sql.VarChar(15), nombre)
            .input('apPaterno', sql.VarChar(15), apPaterno)
            .input('apMaterno', sql.VarChar(15), apMaterno)
            .input('correo', sql.VarChar(45), correo)
            .input('contrasenia', sql.VarChar(30), contrasenia)
            .query(`
                INSERT INTO registro (nombre, apPaterno, apMaterno, correo, contrasenia)
                OUTPUT INSERTED.id
                VALUES (@nombre, @apPaterno, @apMaterno, @correo, @contrasenia)
            `);

        const idRegistro = result.recordset[0].id;

        await connection.request()
            .input('id', sql.Int, idRegistro)
            .input('correo', sql.VarChar, correo)
            .input('contrasenia', sql.VarChar, contrasenia)
            .query(`
                INSERT INTO usuario (id, correo, contrasenia)
                VALUES (@id, @correo, @contrasenia)
            `);

        res.redirect('/');

    } catch (err) {
        console.error(err);
        res.redirect('/?error=Error al registrar usuario');
    }
});

router.post('/login', async (req, res) => {
    const { correo, contrasenia, 'g-recaptcha-response': captcha } = req.body;

    if (!captcha) {
        return res.redirect('/?error=Verifica el reCAPTCHA');
    }

    try {
        // validar reCAPTCHA
        const secretKey = '6LebTlYsAAAAAD0Q3XM3e6ah7CctvUEK4OEclWDR';

        const captchaResponse = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            null,
            { params: { secret: secretKey, response: captcha } }
        );

        if (!captchaResponse.data.success) {
            return res.redirect('/?error=reCAPTCHA inválido');
        }

        const connection = await pool;

        // verificar si el correo existe
        const correoExiste = await connection.request()
            .input('correo', sql.VarChar, correo)
            .query(`
                SELECT id, contrasenia
                FROM usuario
                WHERE correo = @correo
            `);

        // Correo NO existe
        if (correoExiste.recordset.length === 0) {
            return res.redirect('/?error=Correo y contraseña incorrectos');
        }

        const usuarioDB = correoExiste.recordset[0];

        // Contraseña incorrecta
        if (usuarioDB.contrasenia !== contrasenia) {
            return res.redirect('/?error=Contraseña incorrecta');
        }

        // Login exitoso, crear sesión
        const usuario = await connection.request()
            .input('id', sql.Int, usuarioDB.id)
            .query(`
                SELECT id, nombre
                FROM registro
                WHERE id = @id
            `);

        req.session.usuario = usuario.recordset[0];
        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.redirect('/?error=Error interno, intenta más tarde');
    }
});


// Pagina principal del dashboard
router.get('/dashboard', auth, (req, res) => {
    res.sendFile('dashboard.html', { root: 'views' });
});

// Cerrar sesión
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Autenticación de middleware
function auth(req, res, next) {
    if (!req.session.usuario) return res.redirect('/');
    next();
}

module.exports = router;
