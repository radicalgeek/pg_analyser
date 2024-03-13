import { Pool } from 'pg';

export async function analyseUnusedOrRarelyUsedColumns(pool: Pool, table: string): Promise<string> {
  let result = '<h2>Unused or Rarely Used Columns Analysis</h2>';

  try {
    const queryColumns = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1 AND table_schema = 'public'`;

    const resColumns = await pool.query(queryColumns, [table]);
    const columns = resColumns.rows.map(row => row.column_name);

    const unusedColumnPercentageThreshold = parseFloat(process.env.UNUSED_COLUMN_PERCENTAGE_THRESHOLD || '5');

    for (const column of columns) {
      try {
        const queryAnalysis = `
          SELECT COUNT(*) AS total_rows,
                 COUNT("${column}") AS non_null_rows,
                 (COUNT("${column}")::FLOAT / COUNT(*)) * 100 AS non_null_percentage,
                 COUNT(DISTINCT "${column}") AS unique_values
          FROM "${table}"`;

        const resAnalysis = await pool.query(queryAnalysis);
        const { total_rows, non_null_rows, non_null_percentage, unique_values } = resAnalysis.rows[0];

        if (non_null_percentage < unusedColumnPercentageThreshold) {
          result += `Column '${column}' in table '${table}' is rarely used or mostly null (${non_null_percentage}% non-null values).` + '\n';
        }

        if (unique_values === 1 && total_rows > 1) {
          result += `Column '${column}' in table '${table}' might be overusing a default value (only 1 unique value across non-null entries).` + '\n';
        }
      } catch (error) {
        console.error(`Error during rarely used columns analysis for column '${column}' in table '${table}':`, error);
        result += `Error during rarely used columns analysis for column '${column}' in table '${table}'` + '\n';
      }
    }
  } catch (error) {
    console.error(`Error during rarely used columns analysis for table '${table}':`, error);
    result += `Error during rarely used columns analysis for table '${table}'` + '\n';
  }

  if (result === '<h2>Unused or Rarely Used Columns Analysis</h2>') {
    result += 'No Issues Found.';
  }
  return result;
}
