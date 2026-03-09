const express = require('express');
const router = express.Router();
const { sql, pool } = require('../config/db');


/* LISTAR PERSONAS */
router.get('/api/personas', async (req,res)=>{

try{

const page = parseInt(req.query.page) || 1;
const limit = 5;
const offset = (page - 1) * limit;
const search = req.query.search || '';

const connection = await pool;

const totalResult = await connection.request()
.input('search', sql.VarChar, `%${search}%`)
.query(`
SELECT COUNT(*) AS total
FROM personas
WHERE nombre_completo LIKE @search
`);

const total = totalResult.recordset[0].total;

const result = await connection.request()
.input('search', sql.VarChar, `%${search}%`)
.query(`
SELECT id, nombre_completo, pais, estado, direccion, codigo_postal
FROM personas
WHERE nombre_completo LIKE @search
ORDER BY id DESC
OFFSET ${offset} ROWS
FETCH NEXT ${limit} ROWS ONLY
`);

res.json({
data: result.recordset,
totalPages: Math.ceil(total / limit),
page
});

}catch(err){

console.error(err);
res.status(500).json({error:"Error al obtener personas"});

}

});


/* CREAR PERSONA */
router.post('/api/personas', async (req,res)=>{

try{

const { nombre_completo,pais,estado,direccion,codigo_postal } = req.body;

const connection = await pool;

await connection.request()
.input('nombre',sql.VarChar(30),nombre_completo)
.input('pais',sql.VarChar(15),pais)
.input('estado',sql.VarChar(15),estado)
.input('direccion',sql.VarChar(30),direccion)
.input('cp',sql.VarChar(5),codigo_postal)
.query(`
INSERT INTO personas
(nombre_completo,pais,estado,direccion,codigo_postal)
VALUES(@nombre,@pais,@estado,@direccion,@cp)
`);

res.json({success:true});

}catch(err){

console.error(err);
res.status(500).json({error:"Error al crear persona"});

}

});


/* OBTENER PERSONA */
router.get('/api/personas/:id', async (req,res)=>{

try{

const connection = await pool;

const result = await connection.request()
.input('id',sql.Int,req.params.id)
.query(`
SELECT id, nombre_completo, pais, estado, direccion, codigo_postal
FROM personas
WHERE id = @id
`);

res.json(result.recordset[0]);

}catch(err){

console.error(err);
res.status(500).json({error:"Error al obtener persona"});

}

});


/* ACTUALIZAR PERSONA */
router.put('/api/personas/:id', async (req,res)=>{

try{

const { nombre_completo,pais,estado,direccion,codigo_postal } = req.body;

const connection = await pool;

await connection.request()
.input('id',sql.Int,req.params.id)
.input('nombre',sql.VarChar(30),nombre_completo)
.input('pais',sql.VarChar(15),pais)
.input('estado',sql.VarChar(15),estado)
.input('direccion',sql.VarChar(30),direccion)
.input('cp',sql.VarChar(5),codigo_postal)
.query(`
UPDATE personas SET
nombre_completo = @nombre,
pais = @pais,
estado = @estado,
direccion = @direccion,
codigo_postal = @cp
WHERE id = @id
`);

res.json({success:true});

}catch(err){

console.error(err);
res.status(500).json({error:"Error al actualizar persona"});

}

});


/* ELIMINAR PERSONA */
router.delete('/api/personas/:id', async (req,res)=>{

try{

const connection = await pool;

await connection.request()
.input('id',sql.Int,req.params.id)
.query(`
DELETE FROM personas
WHERE id = @id
`);

res.json({success:true});

}catch(err){

console.error(err);
res.status(500).json({error:"Error al eliminar persona"});

}

});


module.exports = router;