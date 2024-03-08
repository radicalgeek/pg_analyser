import { Client } from 'pg';

const isNumber = (value: string): boolean => !isNaN(Number(value));

const isDate = (value: string): boolean => !isNaN(Date.parse(value));

const isBooleanLike = (value: string): boolean => {
  const lowerValue = value.toLowerCase();
  return lowerValue === 'yes' || lowerValue === 'no' || lowerValue === 'true' || lowerValue === 'false' || lowerValue === '1' || lowerValue === '0';
};

export const analyseColumnDataTypes = async (client: Client, table: string): Promise<string> => {

  let result = '<h2>Column Type Analysis</h2>';

  const queryColumns = `
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = $1
      AND data_type IN ('character varying', 'text', 'numeric', 'decimal', 'integer', 'bigint')`;
  
  const resColumns = await client.query(queryColumns, [table]);
  
  for (const { column_name, data_type } of resColumns.rows) {
    const query = `SELECT "${column_name}" FROM "${table}"`;
    const res = await client.query(query);
    const rows = res.rows;

    const allNumbers = rows.every(row => row[column_name] !== null && isNumber(row[column_name]));
    const allDates = rows.every(row => row[column_name] !== null && isDate(row[column_name]));
    const allBooleanLike = rows.every(row => row[column_name] !== null && isBooleanLike(row[column_name].toString()));

    console.log(`Analyzing ${column_name} with data type ${data_type}`);
    console.log(`All Boolean Like: ${allBooleanLike}`);
    console.log(`Rows data:`, rows);


    if ((data_type.includes('character') || data_type === 'text') && allBooleanLike) {
      result += `Column '${column_name}' in table '${table}' might be better as a boolean type.` + '\n';
    } else if (allNumbers || allDates) {
      result += `Column '${column_name}' in table '${table}' might be better as a numeric or date type.` + '\n';
    }

    if ((data_type === 'numeric' || data_type === 'decimal' || data_type === 'integer' || data_type === 'bigint') && allBooleanLike) {
      result += `Numeric column '${column_name}' in table '${table}' might be better as a boolean type (contains only 0 and 1).` + '\n';
    }
  }
  if (result === '<h2>Column Type Analysis</h2>') {
    result += 'No Issues Found.';
  }
  return result;
};
