const express = require('express');
const router = express.Router();
const { sql, pool } = require('../config/db');
const axios = require('axios');
const { signToken, requireAuth, loadPermissions } = require('../middleware/auth');

const RECAPTCHA_SECRET = '6LebTlYsAAAAAD0Q3XM3e6ah7CctvUEK4OEclWDR';
const RECAPTCHA_SITE = '6LebTlYsAAAAADnLSamRI9p-VJYYovtlyxHeRD-8';

router.get('/', (req, res) => {
  res.render('login', { error: req.query.error || '', siteKey: RECAPTCHA_SITE });
});

router.post('/login', async (req, res) => {
  const { usuario, password, 'g-recaptcha-response': captcha } = req.body;
  try {
    if (!captcha) return res.redirect('/?error=Verifica el reCAPTCHA');

    const captchaResponse = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      { params: { secret: RECAPTCHA_SECRET, response: captcha } }
    );

    if (!captchaResponse.data.success) {
      return res.redirect('/?error=Captcha inválido');
    }

    const connection = await pool;
    const result = await connection.request()
      .input('usuario', sql.VarChar(80), usuario)
      .query(`
        SELECT TOP 1
          u.id AS idUsuario,
          u.strNombreUsuario,
          u.strPwd,
          u.idPerfil,
          u.idEstadoUsuario,
          u.strCorreo,
          p.bitAdministrador,
          eu.strNombreEstado
        FROM Usuario u
        INNER JOIN Perfil p ON p.id = u.idPerfil
        INNER JOIN EstadoUsuario eu ON eu.id = u.idEstadoUsuario
        WHERE u.strNombreUsuario = @usuario OR u.strCorreo = @usuario
      `);

    if (!result.recordset.length) return res.redirect('/?error=Usuario o contraseña incorrectos');

    const user = result.recordset[0];
    if (user.strPwd !== password) return res.redirect('/?error=Usuario o contraseña incorrectos');
    if (user.idEstadoUsuario !== 1) return res.redirect('/?error=El usuario no existe o está inactivo');

    const token = signToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.redirect('/?error=Error interno al iniciar sesión');
  }
});

router.get('/dashboard', requireAuth, loadPermissions, async (req, res, next) => {
  try {
    const connection = await pool;
    const menusResult = await connection.request()
      .input('idPerfil', sql.Int, req.user.idPerfil)
      .query(`
        SELECT
          mn.id AS idMenu,
          mn.strNombreMenu,
          mn.intOrdenMenu,
          m.id AS idModulo,
          m.strNombreModulo,
          m.strClaveModulo,
          m.strRuta,
          ISNULL(pp.bitAgregar, 0) AS bitAgregar,
          ISNULL(pp.bitEditar, 0) AS bitEditar,
          ISNULL(pp.bitConsulta, 0) AS bitConsulta,
          ISNULL(pp.bitEliminar, 0) AS bitEliminar,
          ISNULL(pp.bitDetalle, 0) AS bitDetalle
        FROM Menu mn
        INNER JOIN MenuModulo mm ON mm.idMenu = mn.id
        INNER JOIN Modulo m ON m.id = mm.idModulo
        LEFT JOIN PermisosPerfil pp
          ON pp.idModulo = m.id AND pp.idPerfil = @idPerfil
        ORDER BY mn.intOrdenMenu, m.id
      `);

    const visibleMenus = [];
    const map = new Map();

    menusResult.recordset.forEach((row) => {
      const allowed = !!(row.bitAgregar || row.bitEditar || row.bitConsulta || row.bitEliminar || row.bitDetalle);
      if (!map.has(row.idMenu)) map.set(row.idMenu, { id: row.idMenu, nombre: row.strNombreMenu, modulos: [] });
      if (allowed) {
        map.get(row.idMenu).modulos.push({ id: row.idModulo, nombre: row.strNombreModulo, clave: row.strClaveModulo, ruta: row.strRuta });
      }
    });

    map.forEach((menu) => { if (menu.modulos.length > 0) visibleMenus.push(menu); });

    const userResult = await connection.request()
      .input('idUsuario', sql.Int, req.user.idUsuario)
      .query(`
        SELECT u.id, u.strNombreUsuario, u.strCorreo, u.strNumeroCelular, u.strImagen, p.strNombrePerfil
        FROM Usuario u
        INNER JOIN Perfil p ON p.id = u.idPerfil
        WHERE u.id = @idUsuario
      `);

    res.render('dashboard', { user: userResult.recordset[0], menus: visibleMenus, permissions: req.permissions });
  } catch (error) {
    next(error);
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

module.exports = router;
