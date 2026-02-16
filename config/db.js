const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        console.log('Intentando conectar a MongoDB...');
        console.log('URI:', process.env.MONGODB_URI ? 'Configurada' : 'NO CONFIGURADA');
        
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('MongoDB connected successfully');
        console.log('Base de datos:', mongoose.connection.name);
        
        // Esperar a que la conexión esté completamente establecida
        mongoose.connection.on('connected', () => {
            console.log('Mongoose conectado a MongoDB');
        });
        
        mongoose.connection.on('error', (err) => {
            console.error('Error de conexión Mongoose:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose desconectado de MongoDB');
        });
        
    } catch (error) {
        console.error('MongoDB connection error:', error);
        console.error('Error details:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
};

module.exports = connectDB;