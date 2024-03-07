import { Client } from 'pg';

export async function analyzeUnusedOrRarelyUsedColumns(client: Client, table: string): Promise<void> {
  const queryColumns = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = $1 AND table_schema = 'public'`;

  const resColumns = await client.query(queryColumns, [table]);
  const columns = resColumns.rows.map(row => row.column_name);

  const unusedColumnPercentageThreshold = parseFloat(process.env.UNUSED_COLUMN_PERCENTAGE_THRESHOLD || '5');

  for (const column of columns) {
    const queryAnalysis = `
      SELECT COUNT(*) AS total_rows,
             COUNT("${column}") AS non_null_rows,
             (COUNT("${column}")::FLOAT / COUNT(*)) * 100 AS non_null_percentage,
             COUNT(DISTINCT "${column}") AS unique_values
      FROM "${table}"`;

    const resAnalysis = await client.query(queryAnalysis);
    const { total_rows, non_null_rows, non_null_percentage, unique_values } = resAnalysis.rows[0];

    if (non_null_percentage < unusedColumnPercentageThreshold) {
      console.log(`Column '${column}' in table '${table}' is rarely used or mostly null (${non_null_percentage}% non-null values).`);
    }

    if (unique_values === 1 && total_rows > 1) {
      console.log(`Column '${column}' in table '${table}' might be overusing a default value (only 1 unique value across non-null entries).`);
    }
  }
}
