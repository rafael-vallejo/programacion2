const mongoose = require('mongoose');

const connectDB = async (uri = process.env.MONGO_URI) => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    console.log('Conectado a MongoDB');
    return mongoose.connection;
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
