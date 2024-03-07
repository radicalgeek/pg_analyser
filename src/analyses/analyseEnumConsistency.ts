import { Client } from 'pg';

export async function analyzePotentialEnumColumns(client: Client, table: string): Promise<void> {
  const queryColumns = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = $1
      AND table_schema = 'public'
      AND data_type IN ('character varying', 'text')`;

  const resColumns = await client.query(queryColumns, [table]);
  const columns = resColumns.rows.map(row => row.column_name);

  const enumThreshold = parseInt(process.env.ENUM_THRESHOLD || '5');

  for (const column of columns) {
    const queryDistinctValues = `
      SELECT DISTINCT "${column}"
      FROM "${table}"`;
    
    const resDistinctValues = await client.query(queryDistinctValues);
    const distinctValuesCount = resDistinctValues.rowCount || 0;

    if (distinctValuesCount > 0 && distinctValuesCount <= enumThreshold) {
      console.log(`Column '${column}' in table '${table}' has ${distinctValuesCount} distinct values and might be better represented as an enum type.`);
    }
  }
}

