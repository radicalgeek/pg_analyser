import { Client } from 'pg';

export async function analyzeIndexUsageAndTypes(client: Client): Promise<void> {

  const unusedIndexThreshold = parseInt(process.env.UNUSED_INDEX_THRESHOLD || '50');

  //check for unused indexes
  const queryUnusedIndexes = `
    SELECT idx.indrelid::regclass AS table_name,
           idx.indexrelid::regclass AS index_name,
           stat.idx_scan as index_scans
    FROM pg_index idx
    JOIN pg_stat_user_indexes stat ON idx.indexrelid = stat.indexrelid
    WHERE stat.idx_scan < ${unusedIndexThreshold};`; 

  const resUnusedIndexes = await client.query(queryUnusedIndexes);
  for (const row of resUnusedIndexes.rows) {
    console.log(`Index '${row.index_name}' on table '${row.table_name}' has very low usage (${row.index_scans} scans). Consider if it's necessary.`);
  }

  //check for duplicate indexes
  const queryDuplicateIndexes = `
    SELECT
      indrelid::regclass AS table,
      array_agg(indexrelid::regclass) AS duplicate_indexes,
      COUNT(*) 
    FROM pg_index
    GROUP BY indrelid, indkey
    HAVING COUNT(*) > 1;`;

    const resDuplicateIndexes = await client.query(queryDuplicateIndexes);
    for (const row of resDuplicateIndexes.rows) {
      console.log(`Duplicate indexes found on table ${row.table}: ${row.duplicate_indexes.join(', ')}. Consider removing redundant indexes.`);
    }

  // Suggest GIN indexes for columns of type 'text[]' or involved in full-text search
  const queryPotentialGINIndexes = `
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE data_type = 'text[]' OR column_name LIKE '%_text';`;

  const resPotentialGIN = await client.query(queryPotentialGINIndexes);
  for (const row of resPotentialGIN.rows) {
    console.log(`Column '${row.column_name}' on table '${row.table_name}' might benefit from a GIN index for improved search performance.`);
  }

  // Suggest BRIN indexes for large tables with monotonically increasing columns
    const queryBRINCandidateColumns = `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE data_type IN ('timestamp without time zone', 'timestamp with time zone', 'date', 'integer')
        AND table_name NOT IN
          (SELECT DISTINCT indrelid::regclass::text FROM pg_index JOIN pg_class ON pg_class.oid = pg_index.indexrelid WHERE pg_class.relkind = 'i');
    `;
  
    const resPotentialBRIN  = await client.query(queryBRINCandidateColumns);
    for (const row of resPotentialBRIN.rows) {
      console.log(`Column '${row.column_name}' on table '${row.table_name}' might benefit from a BRIN index for faster queries on large, naturally ordered datasets.`);
    }
    
    // Suggest GiST indexes for geometric data types
    const queryGiSTCandidateColumns = `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE data_type IN ('point', 'polygon', 'circle');
    `;

  const resPotentialGiST = await client.query(queryGiSTCandidateColumns);
  for (const row of resPotentialGiST.rows) {
    console.log(`Column '${row.column_name}' on table '${row.table_name}' might benefit from a GiST index for efficient geometric operations.`);
  }

  // Ensure foreign key columns are indexed
  const queryFKColumnsWithoutIndex = `
    SELECT tc.table_schema, tc.table_name, kcu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    WHERE constraint_type = 'FOREIGN KEY'
      AND NOT EXISTS (
        SELECT 1 FROM pg_index
        JOIN pg_attribute ON pg_attribute.attrelid = pg_index.indrelid AND pg_attribute.attnum = ANY(pg_index.indkey)
        WHERE pg_attribute.attname = kcu.column_name AND pg_attribute.attrelid = CONCAT(tc.table_schema, '.', tc.table_name)::regclass
      );
  `;

  const resForeignKeys = await client.query(queryFKColumnsWithoutIndex);
  for (const row of resForeignKeys.rows) {
    console.log(`Foreign key column '${row.column_name}' on table '${row.table_schema}.${row.table_name}' is not indexed. Consider adding an index to improve performance.`);
  }
}
