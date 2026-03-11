const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
    cloud_name: 'dqhqrjoe6',
    api_key: '359285996587242',
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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

let cacheImages = [];
let lastUpdate = 0;
const CACHE_TIME = 60000;

router.post('/upload-image', upload.single('imagen'), async (req, res) => {

    if (!req.file) return res.json({ ok: false, error: 'No file' });

    try {
        await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'gafitas' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

        cacheImages = [];
        lastUpdate = 0;

        res.json({ ok: true });

    } catch (err) {
        console.error('Error Cloudinary upload:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

router.get('/images', async (req, res) => {

    if (cacheImages.length > 0 && (Date.now() - lastUpdate < CACHE_TIME)) {
        return res.json(cacheImages);
    }

    try {
        const result = await cloudinary.search
            .expression('folder:gafitas')
            .sort_by('created_at', 'desc')
            .max_results(50)
            .execute();

        const images = result.resources.map(r => r.secure_url);

        cacheImages = images;
        lastUpdate = Date.now();

        res.json(images);

    } catch (err) {
        console.error('Error Cloudinary list:', err);
        res.json([]);
    }
});

module.exports = router;