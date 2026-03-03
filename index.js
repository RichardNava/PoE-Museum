require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const connectDB = require('./config/db');
const poemRoutes = require('./routes/poem');

const app = express();

const imagesDir = path.join(__dirname, 'frontend', 'src', 'assets', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/webp', 'image/png', 'image/jpeg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Usa: WebP, PNG o JPEG'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Enable CORS with specific options
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:4200,http://localhost:8080")
    .split(",")
    .map(s => s.trim());

app.use(cors({
    origin: function (origin, callback) {
        // Permitir llamadas sin origin (Postman, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Servir imágenes desde assets
app.use('/images', express.static(imagesDir));

// Endpoint para subir imágenes
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No se ha proporcionado ninguna imagen' });
    }
    res.json({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype
    });
});

// Middleware for logging requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Add a test route
app.get('/', (req, res) => {
    res.json({ message: 'PoE Museum API is running' });
});

app.get('/test', (req, res) => {
    console.log('Endpoint de prueba alcanzado');
    res.json({ message: 'Test endpoint working', timestamp: new Date() });
});

// Proxy endpoint para PoE Wiki
app.get('/api/poe-wiki/image', async (req, res) => {
    const { title } = req.query;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    try {
        const imageUrl = await poemRoutes.processImageURI(title);
        res.json({ imageUrl });
    } catch (e) {
        console.error('[Proxy] Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Endpoint alternativo sin Mongoose model
app.get('/api/builds', async (req, res) => {
    try {
        console.log('Endpoint /api/builds - conectando a MongoDB...');
        const mongoose = require('mongoose');

        // Conexión directa
        const conn = mongoose.connection;
        const db = conn.db;

        // Usar colección nativa
        const builds = await db.collection('builds').find({}).toArray();
        console.log(`Encontradas ${builds.length} builds (endpoint /api/builds)`);
        res.json(builds);
    } catch (error) {
        console.error('Error en endpoint /api/builds:', error);
        res.status(500).json({
            message: error.message,
            details: error.stack
        });
    }
});

app.use('/poem', require('./routes/poem'));
app.use('/auth', require('./routes/auth'));

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        message: 'Internal server error',
        error: error.message
    });
});

const PORT = process.env.PORT || 3000;

// Conectar a MongoDB primero
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`API accessible at: http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});