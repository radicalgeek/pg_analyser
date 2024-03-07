import client from './utils/dbClient';
import { analyzeTextAndBinaryDataLength } from './analyses/analyseDataLength';
import { analyzePotentialEnumColumns } from './analyses/analyseEnumConsistency';
import { analyzeNumericPrecisionAndScale } from './analyses/analyseNumericPositionAndScale';
import { analyzeNumberInStringColumns } from './analyses/analyseNumberAndDatesInStrings';
import { analyzeTemporalDataTypeAppropriateness } from './analyses/analyseTemporalAppropriateness';
import { analyzeUnusedOrRarelyUsedColumns } from './analyses/analyseUnusedAndRarelyUsedColumns';
import { checkForeignKeyAndRelationships } from './analyses/analyseForeignKeyRelationships';
import { analyzeIndexUsageAndTypes } from './analyses/analyseIndexUsage';


const analyzeTableColumns = async (table: string): Promise<void> => {
    const query = `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`;
    const res = await client.query(query, [table]);
    const columns = res.rows;

    await analyzeNumberInStringColumns(client, table);
    await analyzeTemporalDataTypeAppropriateness(client, table);
    await analyzeTextAndBinaryDataLength(client, table);
    await analyzePotentialEnumColumns(client, table);
    await analyzeNumericPrecisionAndScale(client, table);
    await analyzeUnusedOrRarelyUsedColumns(client, table);
  };

const main = async () => {
    await client.connect();
  
    try {
      const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
      const tables = res.rows;
      
      //perform analysis on each table
      for (const { table_name } of tables) {
        await analyzeTableColumns(table_name);
      }
      //perform analysis on the database
      await checkForeignKeyAndRelationships(client);
      await analyzeIndexUsageAndTypes(client);

    } catch (error) {
      console.error(`Database analysis failed: ${error}`);
    } finally {
      await client.end();
    }
  };
  
  main();
