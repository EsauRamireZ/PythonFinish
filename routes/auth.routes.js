const express = require('express');
const router = express.Router();
const { sql, pool } = require('../config/db');
const axios = require('axios');

/* ======================
   HOME (LOGIN)
====================== */
router.get('/', (req, res) => {
    res.sendFile('home.html', { root: 'views' });
});

/* ======================
   FORMULARIO REGISTRO
====================== */
router.get('/formulario', (req, res) => {
    res.sendFile('formulario.html', { root: 'views' });
});

/* ======================
   REGISTRO
====================== */
router.post('/registro', async (req, res) => {
    const { nombre, apPaterno, apMaterno, correo, contrasenia } = req.body;

    try {
        const connection = await pool;

        const result = await connection.request()
            .input('nombre', sql.VarChar, nombre)
            .input('apPaterno', sql.VarChar, apPaterno)
            .input('apMaterno', sql.VarChar, apMaterno)
            .input('correo', sql.VarChar, correo)
            .input('contrasenia', sql.VarChar, contrasenia)
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

/* ======================
   LOGIN + reCAPTCHA
====================== */
router.post('/login', async (req, res) => {
    const { correo, contrasenia, 'g-recaptcha-response': captcha } = req.body;

    if (!captcha) {
        return res.redirect('/?error=Verifica el reCAPTCHA');
    }

    try {
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

        const result = await connection.request()
            .input('correo', sql.VarChar, correo)
            .input('contrasenia', sql.VarChar, contrasenia)
            .query(`
                SELECT r.id, r.nombre
                FROM registro r
                INNER JOIN usuario u ON r.id = u.id
                WHERE u.correo = @correo
                AND u.contrasenia = @contrasenia
            `);

        if (result.recordset.length === 0) {
            return res.redirect('/?error=Correo o contraseña incorrectos');
        }

        req.session.usuario = result.recordset[0];
        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.redirect('/?error=Error interno, intenta más tarde');
    }
});

/* ======================
   DASHBOARD
====================== */
router.get('/dashboard', auth, (req, res) => {
    res.sendFile('dashboard.html', { root: 'views' });
});

/* ======================
   LOGOUT
====================== */
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

/* ======================
   MIDDLEWARE AUTH
====================== */
function auth(req, res, next) {
    if (!req.session.usuario) return res.redirect('/');
    next();
}

module.exports = router;
