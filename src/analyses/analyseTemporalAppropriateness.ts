import { Pool } from 'pg';
import { AnalysisResult, MessageType } from '../types/analysisResult';

export async function analyseTemporalDataTypeAppropriateness(pool: Pool, table: string): Promise<AnalysisResult> {
  let result: AnalysisResult = {
    title: `Temporal Data Type Appropriateness Analysis`,
    messages: []
  };

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
        result.messages.push({text:`Column '${column_name}' in table '${table}' uses '${data_type}'. Consider if 'with time zone' might be more appropriate for time zone awareness.`, type: MessageType.Warning});
      }
    }  
  } catch (error) {
    if (error instanceof Error) {
      console.error({text:`Error during temporal data types analysis for table ${table}: ${error.message}`, type: MessageType.Error});
    } else {
      console.error("An unknown error occurred during temporal data types analysis for table ${table}");
    }
    
    result.messages.push({text:`Error during temporal data types analysis for table ${table}.`, type: MessageType.Error});
  }
  if (result.messages.length === 0) {
    result.messages.push({text:`No issues found in table ${table}`, type: MessageType.Info});
  }

  return result;
}
