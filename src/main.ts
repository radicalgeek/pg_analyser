import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import pool from './utils/dbClient';
import { analyzeTextAndBinaryDataLength } from './analyses/analyseDataLength';
import { analyzePotentialEnumColumns } from './analyses/analyseEnumConsistency';
import { analyzeNumericPrecisionAndScale } from './analyses/analyseNumericPositionAndScale';
import { analyseColumnDataTypes } from './analyses/analyseColumnDataTypes';
import { analyzeTemporalDataTypeAppropriateness } from './analyses/analyseTemporalAppropriateness';
import { analyzeUnusedOrRarelyUsedColumns } from './analyses/analyseUnusedAndRarelyUsedColumns';
import { analyzeIndexUsageAndTypes } from './analyses/analyseIndexUsage';


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const port = 3000; 

app.use(bodyParser.json());
app.use(express.static('src/public')); 

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('startAnalysis', async () => {
    let analysisResults = '';

    try {
      const resTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
      const tables = resTables.rows;
      
      // Perform analysis on each table
      for (const { table_name } of tables) {
        analysisResults += `<h1>Analysis for table: ${table_name}</h1>`;
        analysisResults += await analyzeTableColumns(table_name) + '\n';
      }
      // Perform analysis on the database
      analysisResults += await analyzeIndexUsageAndTypes(pool) + '\n';
      socket.emit('analysisComplete', `<pre>${analysisResults}</pre>`);
    } catch (error) {
      console.error(`Database analysis failed: ${error}`);
      analysisResults += `Database analysis failed: ${error}`;
      socket.emit('error', `<pre>${analysisResults}</pre>`);
    }
  });
});

httpServer.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const analyzeTableColumns = async (table: string): Promise<string> => {
  const query = `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`;
  const res = await pool.query(query, [table]);

  let analysisResults = '';

  analysisResults += await analyseColumnDataTypes(pool, table) + '\n';
  analysisResults += await analyzeTemporalDataTypeAppropriateness(pool, table) + '\n';
  analysisResults += await analyzeTextAndBinaryDataLength(pool, table) + '\n';
  analysisResults += await analyzePotentialEnumColumns(pool, table) + '\n';
  analysisResults += await analyzeNumericPrecisionAndScale(pool, table) + '\n';
  analysisResults += await analyzeUnusedOrRarelyUsedColumns(pool, table) + '\n';

  return analysisResults;
};
  
