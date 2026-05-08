const express = require('express');
const mssql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test-route för att se om servern lever
app.get("/", (req, res) => {
    res.send("API is running");
});

// SQL Server Configuration för Azure SQL
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        connectTimeout: 30000
    }
};

let poolPromise;

async function connectDB() {
    try {
        if (!poolPromise) {
            poolPromise = mssql.connect(config);
        }
        const pool = await poolPromise;
        console.log('✅ Connected to Azure SQL Server');
        return pool;
    } catch (err) {
        console.error('❌ DB ERROR:', err);
        throw err;
    }
}

// Routes
app.get('/api/comments', async (req, res) => {
    try {
        const db = await connectDB();
        const result = await db.request().query('SELECT * FROM Comments ORDER BY Timestamp DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error('GET error:', err);
        res.status(500).json({
            error: 'Database error',
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

app.post('/api/comments', async (req, res) => {
    const { name, text } = req.body;
    if (!name || !text) {
        return res.status(400).json({ error: 'Name and text are required' });
    }

    try {
        const db = await connectDB();
        const result = await db.request()
            .input('name', mssql.NVarChar(100), name)
            .input('text', mssql.NVarChar(mssql.MAX), text)
            .query('INSERT INTO Comments (Name, Text) OUTPUT INSERTED.* VALUES (@name, @text)');

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('POST error:', err.message);
        res.status(500).json({ error: 'Failed to create comment', details: err.message });
    }
});

// Admin Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true, message: 'Logged in as admin' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.delete('/api/comments/:id', async (req, res) => {
    const { id } = req.params;
    const { password } = req.body; // In basic implementation, we can pass password in body for deletion

    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const db = await connectDB();
        await db.request()
            .input('id', mssql.Int, id)
            .query('DELETE FROM Comments WHERE Id = @id');
        res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete comment', details: err.message });
    }
});

app.delete('/api/comments', async (req, res) => {
    const { password } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const db = await connectDB();
        await db.request().query('DELETE FROM Comments');
        res.json({ message: 'All comments deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear comments', details: err.message });
    }
});

// Starta endast lokalt, inte i Vercel (Production)
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

// Exportera för Vercel
module.exports = app;
