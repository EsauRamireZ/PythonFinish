const express = require('express');
const router = express.Router();
const multer = require('multer');
const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');

/* ================================
   CACHE EN MEMORIA
================================ */
let cacheImages = [];
let lastUpdate = 0;
const CACHE_TIME = 60000; // 1 minuto

/* ================================
   CONFIGURACIÓN MULTER
================================ */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Solo JPG y PNG'));
        }
    }
});

/* ================================
   SUBIR IMAGEN
================================ */
router.post('/upload-image', upload.single('imagen'), async (req, res) => {

    if (!req.file) return res.redirect('/dashboard');

    const client = new ftp.Client();

    try {
        await client.access({
            host: 'gafitas.somee.com',
            user: 'rafass',
            password: '*5ñZskizzohp',
            secure: false
        });

        const remotePath = `/www.gafitas.somee.com/uploads/${req.file.filename}`;

        await client.uploadFrom(req.file.path, remotePath);

        fs.unlinkSync(req.file.path);

        // 🔥 Limpiar cache para forzar actualización
        cacheImages = [];
        lastUpdate = 0;

        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    } finally {
        client.close();
    }
});

/* ================================
   OBTENER IMÁGENES (CON CACHE)
================================ */
router.get('/images', async (req, res) => {

    // Si el cache sigue vigente, devolverlo
    if (cacheImages.length > 0 && (Date.now() - lastUpdate < CACHE_TIME)) {
        return res.json(cacheImages);
    }

    const client = new ftp.Client();

    try {
        await client.access({
            host: 'gafitas.somee.com',
            user: 'rafass',
            password: '*5ñZskizzohp',
            secure: false
        });

        const files = await client.list('/www.gafitas.somee.com/uploads');

        const images = files
            .filter(f => f.name.endsWith('.jpg') || f.name.endsWith('.png'))
            .map(f => `https://gafitas.somee.com/uploads/${f.name}`);

        // Guardar en cache
        cacheImages = images;
        lastUpdate = Date.now();

        res.json(images);

    } catch (err) {
        console.error(err);
        res.json([]);
    } finally {
        client.close();
    }
});

module.exports = router;