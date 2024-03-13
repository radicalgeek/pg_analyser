import { Pool } from 'pg';

export async function analyseTextAndBinaryDataLength(pool: Pool, table: string): Promise<string> {
  
  let result = '<h2>Text and Binary Data Length Analysis</h2>';
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
          result += `Column '${column_name}' in table '${table}' of type '${data_type}' has maximum length of data: ${maxLengthInRows}. Consider specifying a maximum length.` + '\n';
        } else if (character_maximum_length > maxLengthInRows) {
          result += `Column '${column_name}' in table '${table}' of type '${data_type}' with defined length ${character_maximum_length} could potentially be reduced to ${maxLengthInRows}.` + '\n';
        }
      } catch (error) {
        console.error(`Error during data length analysis for column ${column_name}:`, error);
        result += `Error during data length analysis for column ${column_name}:` + '\n';
      }
    }
  } catch (error) {
    console.error('Error analysing column details:', error);
    result += 'Error during the data length analysis.' + '\n';
  }

  if (result === '<h2>Text and Binary Data Length Analysis</h2>') {
    result += 'No Issues Found.';
  }
  return result;
}
