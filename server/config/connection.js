const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://aliyusunderwood:Aliyus77*@cluster0.4dxthcp.mongodb.net/tactical-tilesdb?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });
  
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

module.exports = mongoose.connection;