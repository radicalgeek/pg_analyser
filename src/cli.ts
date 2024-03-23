import { runAllAnalyses } from './analysesRunner'; 
import { getPool, setupDatabase } from './utils/dbClient';
import { CliArgs } from './types/cliArgs';
import { formatResultsForCLI, groupResultsByTitle, mergeResultsWithSameTitle } from './utils/formatResults';

export async function runCliAnalysis(cliArgs: CliArgs) {

  setupDatabase(cliArgs);
  const pool = getPool();

  try {

    const results = await runAllAnalyses(pool);
    const groupedResults = groupResultsByTitle(results);
    const mergedResults = mergeResultsWithSameTitle(groupedResults);
    const formattedResults = formatResultsForCLI(mergedResults);
    console.log(formattedResults);

  } catch (error) {
    console.error(`Error running CLI analysis: ${error}`);
  } finally {
    await pool.end();
  }
};