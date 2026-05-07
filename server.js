const express = require('express');
const mssql = require('mssql/msnodesqlv8');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// SQL Server Configuration
const config = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_NAME};Trusted_Connection=yes;`,
    parseJSON: true
};

let pool;

/**
 * Connect to SQL Server
 */
async function connectDB() {
    try {
        pool = await mssql.connect(config);
        console.log('✅ Connected to SQL Server LocalDB');
        return pool;
    } catch (err) {
        console.error('❌ Database Connection Failed!', err.message);
        process.exit(1); // Exit if we can't connect
    }
}

// Routes
    
/**
 * GET ALL COMMENTS
 */
app.get('/api/comments', async (req, res) => {
    try {
        if (!pool) await connectDB();
        const result = await pool.request().query('SELECT * FROM Comments ORDER BY Timestamp DESC');
        res.json(result.recordset);
    } catch (err) {
        console.error('GET error:', err.message);
        res.status(500).json({ error: 'Failed to fetch comments', details: err.message });
    }
});

/**
 * CREATE A NEW COMMENT
 */
app.post('/api/comments', async (req, res) => {
    const { name, text } = req.body;
    if (!name || !text) {
        return res.status(400).json({ error: 'Name and text are required' });
    }

    try {
        if (!pool) await connectDB();
        const result = await pool.request()
            .input('name', mssql.NVarChar(100), name)
            .input('text', mssql.NVarChar(mssql.MAX), text)
            .query('INSERT INTO Comments (Name, Text) OUTPUT INSERTED.* VALUES (@name, @text)');
        
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('POST error:', err.message);
        res.status(500).json({ error: 'Failed to create comment', details: err.message });
    }
});

/**
 * DELETE A COMMENT
 */
app.delete('/api/comments/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await mssql.query`DELETE FROM Comments WHERE Id = ${id}`;
        res.json({ message: 'Comment deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete comment', details: err.message });
    }
});

/**
 * DELETE ALL COMMENTS
 */
app.delete('/api/comments', async (req, res) => {
    try {
        await mssql.query`DELETE FROM Comments`;
        res.json({ message: 'All comments deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear comments', details: err.message });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    connectDB();
});
