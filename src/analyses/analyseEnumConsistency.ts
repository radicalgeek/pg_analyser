import { Pool } from 'pg';

export async function analysePotentialEnumColumns(pool: Pool, table: string): Promise<string> {
  let result = '<h2>Potential Enum Columns Analysis</h2>';

  try {
    const queryColumns = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
        AND table_schema = 'public'
        AND data_type IN ('character varying', 'text')`;

    const resColumns = await pool.query(queryColumns, [table]);
    const columns = resColumns.rows.map(row => row.column_name);

    const enumThreshold = parseInt(process.env.ENUM_THRESHOLD || '5');

    for (const column of columns) {
      const queryDistinctValues = `
        SELECT DISTINCT "${column}"
        FROM "${table}"`;

      try {
        const resDistinctValues = await pool.query(queryDistinctValues);
        const distinctValuesCount = resDistinctValues.rowCount || 0;

        if (distinctValuesCount > 0 && distinctValuesCount <= enumThreshold) {
          result += `Column '${column}' in table '${table}' has ${distinctValuesCount} distinct values and might be better represented as an enum type.` + '\n';
        }
      } catch (error) {
        console.error(`Error during distinct values analysis for column ${column}:`, error);
        return result += `Error during distinct values analysis for column ${column}.` + '\n';
      }
    }
  } catch (error) {
    console.error(`Error during potential enum columns analysis for table ${table}:`, error);
    return result += `Error during potential enum columns analysis for table ${table}.`  + '\n';
  }

  if (result === '<h2>Potential Enum Columns Analysis</h2>') {
    result += 'No Issues Found.';
  }
  return result;
}
