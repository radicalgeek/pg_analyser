import { Pool } from 'pg';
import { AnalysisResult, MessageType } from '../types/analysisResult';

export async function analysePotentialEnumColumns(pool: Pool, table: string): Promise<AnalysisResult> {
  let result: AnalysisResult = {
    title: `Potential Enum Columns Analysis`,
    messages: []
  };

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
          result.messages.push({text:`Column '${column}' in table '${table}' has ${distinctValuesCount} distinct values and might be better represented as an enum type.`, type: MessageType.Warning});
        }
      } catch (error) {
        console.error(`Error during distinct values analysis for column ${column}:`, error);
        result.messages.push({text:`Error during distinct values analysis for column ${column}.`, type: MessageType.Error});
      }
    }
  } catch (error) {
    console.error(`Error during potential enum columns analysis for table ${table}:`, error);
    result.messages.push({text:`Error during potential enum columns analysis for table ${table}.`, type: MessageType.Error});
  }

  if (result.messages.length === 0) {
    result.messages.push({text:`No issues found in table ${table}`, type: MessageType.Info});
  }
  return result;
}
