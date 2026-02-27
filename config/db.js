const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = () => {
    console.log('Intentando conectar a MongoDB...');
    console.log('URI:', process.env.MONGODB_URI ? 'Configurada' : 'NO CONFIGURADA');

    // Importante: devolver la promesa para que index.js pueda hacer then/catch bien
    return mongoose
        .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
        .then(() => {
            console.log('✅ MongoDB connected successfully');
            console.log('Base de datos:', mongoose.connection.name);
        })
        .catch((error) => {
            console.error('❌ MongoDB connection error:', error?.message || error);
            // Rechazamos para que lo capture el catch de index.js
            throw error;
        });
};

module.exports = connectDB;