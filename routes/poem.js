const express = require('express');
const router = express.Router();
const Build = require('../models/Build');
const https = require('https');

// Función para obtener URL de imagen de item desde PoE Wiki
function processImageURI(title) {
    return new Promise((resolve, reject) => {

        const apiUrl = `https://www.poewiki.net/api.php?action=query&prop=imageinfo&titles=File:${title.replace(/'/g, "%27").replace(/ /g, "_").replace(/^Synthesised_/, '')}_inventory_icon.png&iiprop=url&format=json`;
                
        https.get(apiUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    const pages = response?.query?.pages;
                    if (!pages) return resolve(null);
                    
                    for (const pageId in pages) {
                        if (parseInt(pageId) < 0) continue;
                        const page = pages[pageId];
                        if (page.imageinfo?.[0]?.url) {
                            return resolve(page.imageinfo[0].url);
                        }
                    }
                    resolve(null);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Función helper para extraer el título del item desde la descripción
function extractItemTitle(description) {
    const lines = description.split('\n');
    // La 4ta línea (índice 3) es el nombre del item
    let title = lines[3]?.trim() || lines[2]?.trim() || lines[0]?.trim() || '';
    
    
    return title;
}

// Función helper para procesar items_mandatory
async function processItemsMandatory(items) {
    if (!items || !Array.isArray(items)) return items;
    
    const processed = await Promise.all(items.map(async (item) => {
        // Si es string (formato antiguo), convertir a objeto
        if (typeof item === 'string') {
            const title = extractItemTitle(item);
            const img = await processImageURI(title).catch(() => null);
            return { description: item, img: img || '' };
        }
        
        // Si ya es objeto pero no tiene img, intentar obtenerla
        if (item && !item.img) {
            const title = extractItemTitle(item.description || '');
            const img = await processImageURI(title).catch(() => null);
            return { ...item, img: img || item.img || '' };
        }
        
        return item;
    }));
    
    return processed;
}

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
        
        const buildData = { ...req.body };
        
        // Procesar items_mandatory para obtener URLs de imágenes
        if (buildData.items_mandatory) {
            buildData.items_mandatory = await processItemsMandatory(buildData.items_mandatory);
        }
        
        const build = new Build({
            ...buildData,
            fecha_creacion: new Date()
        });
        const savedBuild = await build.save();
        res.status(201).json(savedBuild);
    } catch (error) {
        console.error('Error al crear build:', error);
        res.status(400).json({ message: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const buildData = { ...req.body };
        
        // Procesar items_mandatory para obtener URLs de imágenes
        if (buildData.items_mandatory) {
            buildData.items_mandatory = await processItemsMandatory(buildData.items_mandatory);
        }
        
        const build = await Build.findByIdAndUpdate(
            req.params.id,
            buildData,
            { new: true, runValidators: true }
        );
        if (!build) {
            return res.status(404).json({ message: 'Build no encontrada' });
        }
        res.json(build);
    } catch (error) {
        console.error('Error al actualizar build:', error);
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const build = await Build.findByIdAndDelete(req.params.id);
        if (!build) {
            return res.status(404).json({ message: 'Build no encontrada' });
        }
        res.json({ message: 'Build eliminada correctamente', build });
    } catch (error) {
        console.error('Error al eliminar build:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/user/:userId', async (req, res) => {
    try {
        const builds = await Build.find({ usuario_id: req.params.userId });
        res.json(builds);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
module.exports.processImageURI = processImageURI;