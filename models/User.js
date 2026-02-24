const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cuenta_poe: { type: String, default: '' },
    fecha_creacion: { type: Date, default: Date.now }
}, {
    collection: 'users',
    timestamps: false
});

module.exports = mongoose.model('User', userSchema);
