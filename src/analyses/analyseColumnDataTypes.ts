import { Pool } from 'pg';
import { AnalysisResult, MessageType } from '../types/analysisResult';

const isNumber = (value: string): boolean => !isNaN(Number(value));

const isDate = (value: string): boolean => !isNaN(Date.parse(value));

const isBooleanLike = (value: string): boolean => {
  const lowerValue = value.toLowerCase();
  return lowerValue === 'yes' || lowerValue === 'no' || lowerValue === 'true' || lowerValue === 'false' || lowerValue === '1' || lowerValue === '0';
};

export const analyseColumnDataTypes = async (pool: Pool, table: string): Promise<AnalysisResult> => {
  let result: AnalysisResult = {
    title: `Column Type Analysis`,
    messages: []
  };

  try {
    const queryColumns = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = $1
        AND data_type IN ('character varying', 'text', 'numeric', 'decimal', 'integer', 'bigint')`;

    const resColumns = await pool.query(queryColumns, [table]);

    for (const { column_name, data_type } of resColumns.rows) {
      const query = `SELECT "${column_name}" FROM "${table}"`;
      const res = await pool.query(query);
      const rows = res.rows;

      const allNumbers = rows.every(row => row[column_name] !== null && isNumber(row[column_name]));
      const allDates = rows.every(row => row[column_name] !== null && isDate(row[column_name]));
      const allBooleanLike = rows.every(row => row[column_name] !== null && isBooleanLike(row[column_name].toString()));

      if ((data_type.includes('character') || data_type === 'text') && allBooleanLike) {
        result.messages.push({text:`Column '${column_name}' in table '${table}' might be better as a boolean type.`, type: MessageType.Warning});
      } else if (allNumbers || allDates) {
        result.messages.push({text:`Column '${column_name}' in table '${table}' might be better as a numeric or date type.`, type: MessageType.Warning});
      }

      if ((data_type === 'numeric' || data_type === 'decimal' || data_type === 'integer' || data_type === 'bigint') && allBooleanLike) {
        result.messages.push({text:`Numeric column '${column_name}' in table '${table}' might be better as a boolean type (contains only 0 and 1).`, type: MessageType.Warning});
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error during column data type analysis: ${error.message}`);
    } else {
      console.error("An unknown error occurred during column data type analysis.");
    }
    result.messages.push({text:`Error during column data type analysis in table ${table}.`, type: MessageType.Error});
  }

  if (result.messages.length === 0) {
    result.messages.push({text:`No issues found in table ${table}`, type: MessageType.Info});
  }
  return result;
};
