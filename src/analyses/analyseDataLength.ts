import { Pool } from 'pg';
import { AnalysisResult } from '../types/analysisResult';

export async function analyseTextAndBinaryDataLength(pool: Pool, table: string): Promise<AnalysisResult> {
  let result: AnalysisResult = {
    title: `Text and Binary Data Length Analysis`,
    messages: []
  };

  try {
    const query = `
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = $1
        AND data_type IN ('character varying', 'character', 'text', 'bytea')`;

    const { rows } = await pool.query(query, [table]);
    
    for (const row of rows) {
      const { column_name, data_type, character_maximum_length } = row;
      const dataQuery = `
        SELECT MAX(LENGTH("${column_name}")) as max_length
        FROM "${table}"`;

      try {
        const dataRes = await pool.query(dataQuery);
        const maxLengthInRows = dataRes.rows[0].max_length || 0;

        if (data_type === 'text' || data_type === 'bytea') {
          result.messages.push(`Column '${column_name}' in table '${table}' of type '${data_type}' has maximum length of data: ${maxLengthInRows}. Consider specifying a maximum length.`);
        } else if (character_maximum_length > maxLengthInRows) {
          result.messages.push(`Column '${column_name}' in table '${table}' of type '${data_type}' with defined length ${character_maximum_length} could potentially be reduced to ${maxLengthInRows}.`);
        }
      } catch (error) {
        console.error(`Error during data length analysis for column ${column_name}:`, error);
        result.messages.push(`Error during data length analysis for column ${column_name}:`);
      }
    }
  } catch (error) {
    console.error('Error analysing column details:', error);
    result.messages.push('Error during the data length analysis.');
  }

  if (result.messages.length === 0) {
    result.messages.push('No Issues Found.');
  }
  return result;
}
