import { Client } from 'pg';

export async function analyzeTextAndBinaryDataLength(client: Client, table: string): Promise<string> {
  
  let result = '<h2>Text and Binary Data Length Analysis</h2>';

  const query = `
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = $1
      AND data_type IN ('character varying', 'character', 'text', 'bytea')`;

  const { rows } = await client.query(query, [table]);
  
  for (const row of rows) {
    const { column_name, data_type, character_maximum_length } = row;
    const dataQuery = `
      SELECT MAX(LENGTH("${column_name}")) as max_length
      FROM "${table}"`;

    const dataRes = await client.query(dataQuery);
    const maxLengthInRows = dataRes.rows[0].max_length || 0;

    if (data_type === 'text' || data_type === 'bytea') {
      result += `Column '${column_name}' in table '${table}' of type '${data_type}' has maximum length of data: ${maxLengthInRows}. Consider specifying a maximum length.` + '\n';
    } else if (character_maximum_length > maxLengthInRows) {
      result += `Column '${column_name}' in table '${table}' of type '${data_type}' with defined length ${character_maximum_length} could potentially be reduced to ${maxLengthInRows}.` + '\n';
    }
  }
  if (result === '<h2>Text and Binary Data Length Analysis</h2>') {
    result += 'No Issues Found.';
  }
  return result;
}
