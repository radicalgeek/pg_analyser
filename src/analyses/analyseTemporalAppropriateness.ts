import { Pool } from 'pg';

export async function analyseTemporalDataTypeAppropriateness(pool: Pool, table: string): Promise<string> {
  let result = '<h2>Temporal Data Type Appropriateness Analysis</h2>';

  try {
    const queryColumns = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = $1 AND table_schema = 'public'
        AND data_type IN ('date', 'time', 'time without time zone', 'time with time zone', 
                          'timestamp', 'timestamp without time zone', 'timestamp with time zone')`;

    const resColumns = await pool.query(queryColumns, [table]);
    const columns = resColumns.rows;

    for (const { column_name, data_type } of columns) {
      if (data_type.includes('without time zone')) {
        result += `Column '${column_name}' in table '${table}' uses '${data_type}'. Consider if 'with time zone' might be more appropriate for time zone awareness.` + '\n';
      }
    }  
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error during temporal data types analysis for table ${table}: ${error.message}`);
    } else {
      console.error("An unknown error occurred during temporal data types analysis for table ${table}");
    }
    
    result += `Error during temporal data types analysis for table ${table}.` + '\n';
  }
  if (result === '<h2>Temporal Data Type Appropriateness Analysis</h2>') {
    result += 'No Issues Found.';
  }
  return result;
}
