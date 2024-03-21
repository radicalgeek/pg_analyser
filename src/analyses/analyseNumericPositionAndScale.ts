import { Pool } from 'pg';
import { AnalysisResult } from '../types/analysisResult';

export async function analyseNumericPrecisionAndScale(pool: Pool, table: string): Promise<AnalysisResult> {
  let result: AnalysisResult = {
    title: `Numeric Precision and Scale Analysis`,
    messages: []
  };

  try {
    const query = `
      SELECT column_name, numeric_precision, numeric_scale
      FROM information_schema.columns
      WHERE table_name = $1
        AND data_type IN ('numeric', 'decimal')`;

    const { rows } = await pool.query(query, [table]);

    for (const row of rows) {
      const { column_name, numeric_precision, numeric_scale } = row;

      try {
        const dataQuery = `
          SELECT 
            MAX(precision_length) AS max_precision,
            MAX(scale_length) AS max_scale
          FROM (
            SELECT
              LENGTH((regexp_matches(CAST("${column_name}" AS TEXT), '^-?\\d*'))[1]) AS precision_length,
              LENGTH(SUBSTRING(CAST("${column_name}" AS TEXT) FROM '\\.\\d+$')) - 1 AS scale_length
            FROM "${table}"
            WHERE "${column_name}" IS NOT NULL
          ) AS subquery`;

        const dataRes = await pool.query(dataQuery);
        const maxPrecision = dataRes.rows[0] ? dataRes.rows[0].max_precision : null;
        const maxScale = dataRes.rows[0] ? dataRes.rows[0].max_scale : null;

        if (maxPrecision !== null && numeric_precision > maxPrecision) {
          result.messages.push(`Column '${column_name}' in table '${table}' has defined numeric precision of ${numeric_precision} which could potentially be reduced to ${maxPrecision}.`);
        }

        if (maxScale !== null && numeric_scale > maxScale) {
          result.messages.push(`Column '${column_name}' in table '${table}' has defined numeric scale of ${numeric_scale} which could potentially be reduced to ${maxScale}.`);
        }
      } catch (error) {
        console.error(`Error during numeric precision and scale analysis for column ${column_name}: ${error}`);
        result.messages.push(`Error during numeric precision and scale analysis for column ${column_name}:`);
      }
    }
  } catch (error) {
    console.error(`Error during the numeric precision and scale analysis: ${error}`);
    result.messages.push('Error during the numeric precision and scale analysis.');
  }

  if (result.messages.length === 0) {
    result.messages.push('No Issues Found.');
  }

  return result;
}
