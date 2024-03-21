import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import pool from './utils/dbClient';
import { Request, Response, NextFunction } from 'express';
import * as Analyses from './analyses';


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const port = 3000; 

app.use(bodyParser.json());
app.use(express.static('src/public')); 

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('startAnalysis', async () => {
    pool.connect(async (err, client, release) => {
      if (err) {
        socket.emit('error', '<pre>Database connection error. Please check your configuration.</pre>');
        return console.error('Error acquiring database client', err.stack);
      }
      let analysisResults = '';

      try {
        const resTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tables = resTables.rows;
        
        // Perform analysis on each table
        for (const { table_name } of tables) {
          analysisResults += `<h1>Analysis for table: ${table_name}</h1>`;
          analysisResults += await analyseTableColumns(table_name) + '\n';
        }
        // Perform analysis on the database
        analysisResults += await Analyses.analyseIndexUsageAndTypes(pool) + '\n';
        analysisResults += await Analyses.analyseSuperuserAccess(pool) + '\n';
        analysisResults += await Analyses.analyseDefaultAccounts(pool) + '\n';
        analysisResults += await Analyses.analyseRolesPermissionsAndDatabases(pool) + '\n';
        analysisResults += await Analyses.analysePasswordPolicy(pool) + '\n';
        analysisResults += await Analyses.analyseLoggingAndAuditing(pool) + '\n';
        analysisResults += await Analyses.analyseSensitiveDataExposure(pool) + '\n';
        analysisResults += await Analyses.analyseDataInTransitEncryption(pool) + '\n';
        analysisResults += await Analyses.analyseDataAtRestEncryption(pool) + '\n';
        
        socket.emit('analysisComplete', `<pre>${analysisResults}</pre>`);
      } catch (error) {
        console.error(`Database analysis failed: ${error}`);
        analysisResults += `Database analysis failed: ${error}`;
        socket.emit('error', `<pre>${analysisResults}</pre>`);
      }
    });
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

httpServer.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const analyseTableColumns = async (table: string): Promise<string> => {
  const query = `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`;
  const res = await pool.query(query, [table]);

  let analysisResults = '';

  analysisResults += await Analyses.analyseColumnDataTypes(pool, table) + '\n';
  analysisResults += await Analyses.analyseTemporalDataTypeAppropriateness(pool, table) + '\n';
  analysisResults += await Analyses.analyseTextAndBinaryDataLength(pool, table) + '\n';
  analysisResults += await Analyses.analysePotentialEnumColumns(pool, table) + '\n';
  analysisResults += await Analyses.analyseNumericPrecisionAndScale(pool, table) + '\n';
  analysisResults += await Analyses.analyseUnusedOrRarelyUsedColumns(pool, table) + '\n';

  return analysisResults;
};
  
