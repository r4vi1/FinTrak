const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ───────────────────────────────────────────
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/analytics', require('./routes/analytics'));

// ── Health check ─────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler ────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err.message);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    });
});

// ── Start ────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 FinTrak API running on http://localhost:${PORT}`);
});

module.exports = app;
