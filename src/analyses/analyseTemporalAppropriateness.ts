import { Client } from 'pg';

export async function analyzeTemporalDataTypeAppropriateness(client: Client, table: string): Promise<string> {

  let result = '';

  const queryColumns = `
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = $1 AND table_schema = 'public'
      AND data_type IN ('date', 'time', 'time without time zone', 'time with time zone', 
                        'timestamp', 'timestamp without time zone', 'timestamp with time zone')`;

  const resColumns = await client.query(queryColumns, [table]);
  const columns = resColumns.rows;

  for (const { column_name, data_type } of columns) {
    if (data_type.includes('without time zone')) {
      result += `Column '${column_name}' in table '${table}' uses '${data_type}'. Consider if 'with time zone' might be more appropriate for time zone awareness.` + '\n';
    }
  }
  return result;
}
