require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

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
app.use(cors({
    origin: ['http://localhost:4200', 'http://localhost:8080'],
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

// Endpoint de prueba con datos mock
app.get('/api/builds/mock', (req, res) => {
    const mockBuilds = [
        {
            _id: "1",
            nombre: "Tragthusk - Righteous Fire CWS",
            autor: "Rnava",
            clase: "Marauder",
            ascendencia: "Chieftain",
            descripcion: "Walking simulator que basa su daño en RF y varias habilidades de fuego.",
            ventajas: "- Clear pasivo\n- Muy tanky\n- Cómodidad extrema",
            desventajas: "- Daño de boss limitado\n- Gear específico",
            imagen: "",
            imagen_mime: "",
            valoraciones: {
                boss_dmg: 2.7,
                comfort: 5,
                difficulty: 1.6,
                fun: 3.8,
                map_speed_clear: 4.2,
                survivality: 4.9
            },
            versiones: [
                {
                    name: "Fire Staff + Endurance Stack",
                    pobb: "https://pobb.in/ItuXrPxPUECs"
                }
            ],
            fecha_creacion: new Date("2026-01-12T01:28:23.000Z")
        }
    ];
    console.log('Enviando datos mock');
    res.json(mockBuilds);
});

app.use('/poem', require('./routes/poem'));

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