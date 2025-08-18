const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Route for download page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Siya Portal Mobile Download' });
});

app.listen(PORT, () => {
    console.log(`🚀 Mobile app download server running on port ${PORT}`);
    console.log(`📱 Access download page at: http://localhost:${PORT}`);
});
