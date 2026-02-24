const mongoose = require('mongoose');

const valoracionSchema = new mongoose.Schema({
    boss_dmg: { type: Number, required: true },
    comfort: { type: Number, required: true },
    difficulty: { type: Number, required: true },
    fun: { type: Number, required: true },
    map_speed_clear: { type: Number, required: true },
    survivality: { type: Number, required: true }
});

const versionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    pobb: { type: String, required: true }
});

const buildSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    autor: { type: String, required: true },
    usuario_id: { type: String, required: true },
    clase: { type: String, required: true },
    ascendencia: { type: String, required: true },
    descripcion: { type: String, required: true },
    ventajas: { type: String, required: true },
    desventajas: { type: String, required: true },
    imagen: { type: String, default: '' },
    imagen_mime: { type: String, default: '' },
    valoraciones: { type: valoracionSchema, required: true },
    versiones: [versionSchema],
    fecha_creacion: { type: Date, default: Date.now }
}, {
    collection: 'builds',
    timestamps: false
});

module.exports = mongoose.model('Build', buildSchema);