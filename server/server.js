const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});


app.get('/',(req,res)=>{
    res.send("Welcome to RAG Chat server")
 })
 
// Routes
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/auth', require('./routes/passwordReset')); // New password reset routes
// app.use('/api/upload', require('./routes/upload'));
// app.use('/api/chat', require('./routes/chat'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});