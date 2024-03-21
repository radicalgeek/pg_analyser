import pool from './utils/dbClient';
import * as Analyses from './analyses';
import { AnalysisResult } from './types/analysisResult';

export async function runAllAnalyses(): Promise<AnalysisResult[]> {
  let analysisResults: AnalysisResult[] = [];

  try {
    const resTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    const tables = resTables.rows;

    // Perform analysis on each table
    for (const { table_name } of tables) {
      const tableAnalysisResults = await analyseTableColumns(table_name);
      analysisResults.push(...tableAnalysisResults);
    }

    // Perform analysis on the database
    analysisResults.push(await Analyses.analyseIndexUsageAndTypes(pool));
    analysisResults.push(await Analyses.analyseSuperuserAccess(pool));
    analysisResults.push(await Analyses.analyseDefaultAccounts(pool));
    analysisResults.push(await Analyses.analyseRolesPermissionsAndDatabases(pool));
    analysisResults.push(await Analyses.analysePasswordPolicy(pool));
    analysisResults.push(await Analyses.analyseLoggingAndAuditing(pool));
    analysisResults.push(await Analyses.analyseSensitiveDataExposure(pool));
    analysisResults.push(await Analyses.analyseDataInTransitEncryption(pool));
    analysisResults.push(await Analyses.analyseDataAtRestEncryption(pool));

  } catch (error) {
    console.error(`Database analysis failed: ${error}`);
    throw new Error(`Database analysis failed: ${error}`);
  }

  return analysisResults;

}
const analyseTableColumns = async (table: string): Promise<AnalysisResult[]> => {
  const query = `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`;
  const res = await pool.query(query, [table]);

  let analysisResults: AnalysisResult[] = [];

  analysisResults.push(await Analyses.analyseColumnDataTypes(pool, table));
  analysisResults.push(await Analyses.analyseTemporalDataTypeAppropriateness(pool, table));
  analysisResults.push(await Analyses.analyseTextAndBinaryDataLength(pool, table));
  analysisResults.push(await Analyses.analysePotentialEnumColumns(pool, table));
  analysisResults.push(await Analyses.analyseNumericPrecisionAndScale(pool, table));
  analysisResults.push(await Analyses.analyseUnusedOrRarelyUsedColumns(pool, table));

  return analysisResults;
};
