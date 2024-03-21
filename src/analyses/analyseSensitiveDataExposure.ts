import { Pool } from 'pg';
import { AnalysisResult } from '../types/analysisResult';

const sensitiveKeywords = ['password','passwd', 'token', 'apikey', 'secret'];
const systemTables = ['pg_ts_config_map', 'pg_ts_parser', 'pg_roles', 'pg_user', 'pg_authid', 'pg_shadow'];

export async function analyseSensitiveDataExposure(pool: Pool): Promise<AnalysisResult> {
  let result: AnalysisResult = {
    title: `Exposed Sensitive Information Analysis`,
    messages: []
  };

  const likeConditions = sensitiveKeywords.map(keyword => `column_name LIKE '%${keyword}%'`).join(' OR ');
  const query = `
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE ${likeConditions}
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
      AND table_name NOT LIKE 'pg_%';
  `;

  try {
    const { rows } = await pool.query(query);
    const filteredRows = rows.filter(row => !systemTables.includes(row.table_name));
    if (filteredRows.length > 0) {
      filteredRows.forEach(row => {
        result.messages.push(`Potential sensitive column found: ${row.table_name}.${row.column_name}`);
      });
    } else {
      result.messages.push('No obvious sensitive information columns found.');
    }
  } catch (error) {
    console.error(`Error during exposed sensitive information analysis: ${error}`);
    result.messages.push('An error occurred while analysing for exposed sensitive information.');
  }

  return result;
}
