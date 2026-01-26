const sql = require('mssql');

const config = {
    user: 'db38571',
    password: 'wP_4T2s?z+9G',
    server: 'db38571.public.databaseasp.net',
    database: 'db38571',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

const pool = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('SQL Server conectado');
        return pool;
    })
    .catch(err => console.error('Error SQL:', err));

module.exports = {
    sql,
    pool
};
