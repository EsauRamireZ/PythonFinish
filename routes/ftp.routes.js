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
const CACHE_TIME = 60000;

/* ================================
   CONFIGURACIÓN MULTER (MEMORIA)
================================ */
const upload = multer({
    storage: multer.memoryStorage(),
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

    const filename = Date.now() + '-' + Math.round(Math.random() * 1e9)
                     + path.extname(req.file.originalname);

    const tmpPath = `/tmp/${filename}`;

    try {
        // Guardar en /tmp (Render siempre tiene esta carpeta)
        fs.writeFileSync(tmpPath, req.file.buffer);

        await client.access({
            host: 'gafitas.somee.com',
            user: 'rafass',
            password: '*5ñZskizzohp',
            secure: false
        });

        const remotePath = `/www.gafitas.somee.com/uploads/${filename}`;

        await client.uploadFrom(tmpPath, remotePath);

        fs.unlinkSync(tmpPath);

        cacheImages = [];
        lastUpdate = 0;

        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        res.redirect('/dashboard');
    } finally {
        client.close();
    }
});

/* ================================
   OBTENER IMÁGENES (CON CACHE)
================================ */
router.get('/images', async (req, res) => {

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