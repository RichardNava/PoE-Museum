const mongoose = require('mongoose');
require('dotenv').config();

async function testQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const Build = require('./models/Build');
    
    console.log('Iniciando consulta...');
    const startTime = Date.now();
    
    const builds = await Build.find({}).lean();
    
    const endTime = Date.now();
    console.log(`Consulta completada en ${endTime - startTime}ms`);
    console.log(`Encontradas ${builds.length} builds`);
    
    builds.forEach(b => {
      console.log(`- ${b.nombre} (autor: ${b.autor})`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error en consulta:', error);
  }
}

testQuery();