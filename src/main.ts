import express from 'express';
import bodyParser from 'body-parser';
import client from './utils/dbClient';
import { analyzeTextAndBinaryDataLength } from './analyses/analyseDataLength';
import { analyzePotentialEnumColumns } from './analyses/analyseEnumConsistency';
import { analyzeNumericPrecisionAndScale } from './analyses/analyseNumericPositionAndScale';
import { analyzeNumberInStringColumns } from './analyses/analyseNumberAndDatesInStrings';
import { analyzeTemporalDataTypeAppropriateness } from './analyses/analyseTemporalAppropriateness';
import { analyzeUnusedOrRarelyUsedColumns } from './analyses/analyseUnusedAndRarelyUsedColumns';
import { checkForeignKeyAndRelationships } from './analyses/analyseForeignKeyRelationships';
import { analyzeIndexUsageAndTypes } from './analyses/analyseIndexUsage';


const app = express();
const port = 3000; 


app.use(bodyParser.json());
app.use(express.static('src/public')); 

app.get('/analyze', async (req: any, res: { send: (arg0: string) => void; }) => {
    
    let analysisResults = '';
  
    try {
      await client.connect().catch(error => {
        console.log("Connection attempt error:", error.message);
    });


      const resTables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
      const tables = resTables.rows;
      
      // Perform analysis on each table
      for (const { table_name } of tables) {
        analysisResults += `<h1>Analysis for table: ${table_name}</h1>`;
        analysisResults += await analyzeTableColumns(table_name) + '\n';
      }
      // Perform analysis on the database
      //analysisResults += await checkForeignKeyAndRelationships(client) + '\n';
      analysisResults += await analyzeIndexUsageAndTypes(client) + '\n';
    } catch (error) {
      console.error(`Database analysis failed: ${error}`);
      analysisResults += `Database analysis failed: ${error}`;
      res.send(`<pre>${analysisResults}</pre>`);
    } 
  
    res.send(`<pre>${analysisResults}</pre>`); // Send results formatted as preformatted text
  });
  
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });


const analyzeTableColumns = async (table: string): Promise<string> => {
    const query = `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`;
    const res = await client.query(query, [table]);

    let analysisResults = '';

    analysisResults += await analyzeNumberInStringColumns(client, table) + '\n';
    analysisResults += await analyzeTemporalDataTypeAppropriateness(client, table) + '\n';
    analysisResults += await analyzeTextAndBinaryDataLength(client, table) + '\n';
    analysisResults += await analyzePotentialEnumColumns(client, table) + '\n';
    analysisResults += await analyzeNumericPrecisionAndScale(client, table) + '\n';
    analysisResults += await analyzeUnusedOrRarelyUsedColumns(client, table) + '\n';

    return analysisResults;
  };
  
