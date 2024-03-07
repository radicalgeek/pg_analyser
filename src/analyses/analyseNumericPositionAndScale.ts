import { Client } from 'pg';

export async function analyzeNumericPrecisionAndScale(client: Client, table: string): Promise<string> {

  let result = '<h2>Numeric Precision and Scale Analysis</h2>';

  const query = `
    SELECT column_name, numeric_precision, numeric_scale
    FROM information_schema.columns
    WHERE table_name = $1
      AND data_type IN ('numeric', 'decimal')`;

  const { rows } = await client.query(query, [table]);
  
  for (const row of rows) {
    const { column_name, numeric_precision, numeric_scale } = row;
    const dataQuery = `
    SELECT 
      MAX(precision_length) AS max_precision,
      MAX(scale_length) AS max_scaleß
    FROM (
      SELECT
        LENGTH((regexp_matches(CAST("${column_name}" AS TEXT), '^-?\\d*'))[1]) AS precision_length,
        LENGTH(SUBSTRING(CAST("${column_name}" AS TEXT) FROM '\\.\\d+$')) - 1 AS scale_length
      FROM "${table}"
      WHERE "${column_name}" IS NOT NULL
    ) AS subquery`;

    const dataRes = await client.query(dataQuery);
    const maxPrecision = dataRes.rows[0] ? dataRes.rows[0].max_precision : null;
    const maxScale = dataRes.rows[0] ? dataRes.rows[0].max_scale : null;

    if (maxPrecision !== null && numeric_precision > maxPrecision) {
      result += `Column '${column_name}' in table '${table}' has defined numeric precision of ${numeric_precision} which could potentially be reduced to ${maxPrecision}.` + '\n';
    }

    if (maxScale !== null && numeric_scale > maxScale) {
      result += `Column '${column_name}' in table '${table}' has defined numeric scale of ${numeric_scale} which could potentially be reduced to ${maxScale}.` + '\n';
    }
  }
  if (result === '<h2>Numeric Precision and Scale Analysis</h2>') {
    result += 'No Issues Found.';
  }
  return result;
}
