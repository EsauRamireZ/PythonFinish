const jwt = require('jsonwebtoken');
const { sql, pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'mi_servidor_jwt_secret_2026';

function parseCookies(cookieHeader = '') {
  const cookies = {};
  cookieHeader.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const key = part.slice(0, idx).trim();
      const value = decodeURIComponent(part.slice(idx + 1).trim());
      cookies[key] = value;
    }
  });
  return cookies;
}

function signToken(user) {
  return jwt.sign(
    {
      idUsuario: user.idUsuario,
      idPerfil: user.idPerfil,
      nombre: user.strNombreUsuario,
      administrador: !!user.bitAdministrador
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function requireAuth(req, res, next) {
  try {
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies.token;
    if (!token) return res.redirect('/');
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (_error) {
    return res.redirect('/');
  }
}

async function loadPermissions(req, res, next) {
  try {
    const connection = await pool;
    const result = await connection.request()
      .input('idPerfil', sql.Int, req.user.idPerfil)
      .query(`
        SELECT
          m.id,
          m.strNombreModulo,
          m.strClaveModulo,
          m.strRuta,
          ISNULL(pp.bitAgregar, 0) AS bitAgregar,
          ISNULL(pp.bitEditar, 0) AS bitEditar,
          ISNULL(pp.bitConsulta, 0) AS bitConsulta,
          ISNULL(pp.bitEliminar, 0) AS bitEliminar,
          ISNULL(pp.bitDetalle, 0) AS bitDetalle
        FROM Modulo m
        LEFT JOIN PermisosPerfil pp
          ON pp.idModulo = m.id
         AND pp.idPerfil = @idPerfil
      `);

    const permissions = {};
    result.recordset.forEach((row) => {
      permissions[row.strClaveModulo] = {
        idModulo: row.id,
        nombre: row.strNombreModulo,
        ruta: row.strRuta,
        agregar: !!row.bitAgregar,
        editar: !!row.bitEditar,
        consulta: !!row.bitConsulta,
        eliminar: !!row.bitEliminar,
        detalle: !!row.bitDetalle,
        any: !!(row.bitAgregar || row.bitEditar || row.bitConsulta || row.bitEliminar || row.bitDetalle)
      };
    });

    req.permissions = permissions;
    next();
  } catch (error) {
    next(error);
  }
}

function requireModuleAccess(moduleKey, action = null) {
  return (req, res, next) => {
    const permission = req.permissions?.[moduleKey];
    if (!permission || !permission.any) return res.redirect('/');
    if (action && !permission[action]) {
      return res.status(403).json({ ok: false, message: 'No tienes permiso para esta acción' });
    }
    next();
  };
}

module.exports = { signToken, requireAuth, loadPermissions, requireModuleAccess, parseCookies };
