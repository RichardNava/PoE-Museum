const express = require('express');
const router = express.Router();
const Build = require('../models/Build');

router.get('/all', async (req, res) => {
    try {
        console.log('Recibida petición GET /poem/all');
        
        // Forzar conexión fresca cada vez
        const mongoose = require('mongoose');
        if (mongoose.connection.readyState !== 1) {
            console.log('Estado de conexión:', mongoose.connection.readyState);
            await mongoose.connect(process.env.MONGODB_URI);
        }
        
        const builds = await Build.find({}).lean().maxTimeMS(30000);
        console.log(`Encontradas ${builds.length} builds`);
        res.json(builds);
    } catch (error) {
        console.error('Error en GET /poem/all:', error);
        console.error('Nombre del error:', error.name);
        console.error('Mensaje:', error.message);
        
        res.status(500).json({ 
            message: error.message,
            details: error.stack
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const build = await Build.findById(req.params.id);
        if (!build) {
            return res.status(404).json({ message: 'Build not found' });
        }
        res.json(build);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/name/:name', async (req, res) => {
    try {
        const builds = await Build.find({
            nombre: { $regex: req.params.name, $options: 'i' }
        });
        res.json(builds);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        console.log('Datos recibidos en POST /:', JSON.stringify(req.body, null, 2));
        const build = new Build({
            ...req.body,
            fecha_creacion: new Date()
        });
        const savedBuild = await build.save();
        res.status(201).json(savedBuild);
    } catch (error) {
        console.error('Error al crear build:', error);
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;