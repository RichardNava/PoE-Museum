const mongoose = require('mongoose');
require('dotenv').config();

// Test data
const sampleBuild = {
  nombre: "Test Build - Righteous Fire Juggernaut",
  autor: "Test User",
  clase: "Marauder",
  ascendencia: "Juggernaut",
  descripcion: "Build de prueba para Righteous Fire con Juggernaut",
  ventajas: "- Mucha supervivencia\n- Fácil de jugar\n- Buen clear",
  desventajas: "- Daño limitado\n- Requiere gear específico",
  imagen: "",
  imagen_mime: "",
  valoraciones: {
    boss_dmg: 3.5,
    map_speed_clear: 4.0,
    survivality: 4.8,
    difficulty: 1.5,
    fun: 3.2,
    comfort: 4.5
  },
  versiones: [
    {
      name: "Standard Version",
      pobb: "https://pobb.in/test-build"
    }
  ],
  fecha_creacion: new Date()
};

async function addTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Build = require('./models/Build');
    
    console.log('Añadiendo datos de prueba...');
    const result = await Build.create(sampleBuild);
    console.log('Build añadida:', result.nombre);
    
    // List all builds
    const builds = await Build.find({});
    console.log(`Total builds en BD: ${builds.length}`);
    builds.forEach(b => console.log(`- ${b.nombre}`));
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

addTestData();