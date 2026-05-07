const mssql = require('mssql/msnodesqlv8');
require('dotenv').config();

const config = {
    connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_NAME};Trusted_Connection=yes;`,
};

console.log('Testing connection to:', config.connectionString);

async function test() {
    try {
        console.log('Attempting to connect...');
        const pool = await mssql.connect(config);
        console.log('Success! Connected.');
        const result = await pool.request().query('SELECT name FROM sys.databases');
        console.log('Databases:', result.recordset);
        await mssql.close();
    } catch (err) {
        console.error('Connection failed:', err.message);
    }
}

test();
