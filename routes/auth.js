const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/register', async (req, res) => {
    try {
        const { nombre, email, password, cuenta_poe } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }
        
        const user = new User({
            nombre,
            email,
            password,
            cuenta_poe: cuenta_poe || '',
            fecha_creacion: new Date()
        });
        
        await user.save();
        
        const userResponse = {
            _id: user._id,
            nombre: user.nombre,
            email: user.email,
            cuenta_poe: user.cuenta_poe,
            rol: user.rol,
            fecha_creacion: user.fecha_creacion
        };
        
        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Error en register:', error);
        res.status(400).json({ message: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Email o password incorrectos' });
        }

        const storedPassword = user.password || user.contraseña;
        
        if (storedPassword !== password) {
            return res.status(401).json({ message: 'Email o password incorrectos' });
        }
        
        const userResponse = {
            _id: user._id,
            nombre: user.nombre,
            email: user.email,
            cuenta_poe: user.cuenta_poe,
            rol: user.rol,
            fecha_creacion: user.fecha_creacion
        };
        
        res.json(userResponse);
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
