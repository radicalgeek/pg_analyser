import { Client } from 'pg';

export async function checkForeignKeyAndRelationships(client: Client): Promise<void> {
  const queryForeignKeys = `
    SELECT
      tc.table_schema,
      tc.table_name,
      kcu.column_name,
      ccu.table_schema AS foreign_table_schema,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'`;

  const { rows: foreignKeys } = await client.query(queryForeignKeys);

  for (const fk of foreignKeys) {
    const queryColumnTypes = `
      SELECT
        (SELECT data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = $3) AS column_data_type,
        (SELECT data_type FROM information_schema.columns WHERE table_schema = $4 AND table_name = $5 AND column_name = $6) AS foreign_column_data_type`;

    const { rows: columnTypes } = await client.query(queryColumnTypes, [
      fk.table_schema, fk.table_name, fk.column_name,
      fk.foreign_table_schema, fk.foreign_table_name, fk.foreign_column_name
    ]);

    if (columnTypes[0].column_data_type !== columnTypes[0].foreign_column_data_type) {
      console.log(`Data type mismatch in foreign key relationship: ${fk.table_name}.${fk.column_name} (${columnTypes[0].column_data_type}) -> ${fk.foreign_table_name}.${fk.foreign_column_name} (${columnTypes[0].foreign_column_data_type})`);
    }
  }
}
