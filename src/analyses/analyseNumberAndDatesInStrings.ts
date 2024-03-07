import { Client } from 'pg';

const isNumber = (value: string): boolean => !isNaN(Number(value));

const isDate = (value: string): boolean => !isNaN(Date.parse(value));

export const analyzeNumberInStringColumns = async (client: Client, table: string): Promise<string> => {

  let result = '';

  const queryColumns = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = $1
      AND data_type IN ('character varying', 'text')`;
  
  const resColumns = await client.query(queryColumns, [table]);
  
  for (const { column_name } of resColumns.rows) {
    const query = `SELECT "${column_name}" FROM "${table}"`;
    const res = await client.query(query);
    const rows = res.rows;

    const allNumbers = rows.every(row => row[column_name] !== null && isNumber(row[column_name]));
    const allDates = rows.every(row => row[column_name] !== null && isDate(row[column_name]));

    if (allNumbers || allDates) {
      result += `Column '${column_name}' in table '${table}' might be better as a numeric or date type.` + '\n';
    }
  }
  return result;
};
