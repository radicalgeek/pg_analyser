import { Pool } from 'pg';
import { AnalysisResult, MessageType } from '../types/analysisResult';

export async function analyseIndexUsageAndTypes(pool: Pool): Promise<AnalysisResult> {
  let result: AnalysisResult = {
    title: `Index Usage and Types Analysis`,
    messages: []
  };
  const unusedIndexThreshold = parseInt(process.env.UNUSED_INDEX_THRESHOLD || '50');

  try {
    //check for unused indexes
    const queryUnusedIndexes = `
      SELECT idx.indrelid::regclass AS table_name,
            idx.indexrelid::regclass AS index_name,
            stat.idx_scan as index_scans
      FROM pg_index idx
      JOIN pg_class cls ON cls.oid = idx.indrelid
      JOIN pg_namespace ns ON ns.oid = cls.relnamespace
      JOIN pg_stat_user_indexes stat ON idx.indexrelid = stat.indexrelid
      WHERE stat.idx_scan < ${unusedIndexThreshold}
      AND ns.nspname NOT IN ('pg_catalog', 'information_schema');`; 

    const resUnusedIndexes = await pool.query(queryUnusedIndexes);
    for (const row of resUnusedIndexes.rows) {
      result.messages.push({text:`Index '${row.index_name}' on table '${row.table_name}' has very low usage (${row.index_scans} scans). Consider if it's necessary.`, type: MessageType.Warning});
    }
  } catch (error) {
    console.error('Error during the unused index analysis:', error);
    result.messages.push({text:'Error during the unused index analysis.', type: MessageType.Error});
  }


  try {
    //check for duplicate indexes
    const queryDuplicateIndexes = `
      SELECT
        indrelid::regclass AS table,
        array_agg(indexrelid::regclass) AS duplicate_indexes,
        COUNT(*) 
      FROM pg_index
      GROUP BY indrelid, indkey
      HAVING COUNT(*) > 1;`;

      const resDuplicateIndexes = await pool.query(queryDuplicateIndexes);
      for (const row of resDuplicateIndexes.rows) {
        result.messages.push({text:`Duplicate indexes found on table ${row.table}: ${row.duplicate_indexes.join(', ')}. Consider removing redundant indexes.`, type: MessageType.Warning});
      }
  } catch (error) {
    console.error('Error during the duplicate index analysis:', error);
    result.messages.push({text:'Error during the duplicate index analysis.', type: MessageType.Error});
  }

  try {
    // Suggest GIN indexes for columns of type 'text[]' or involved in full-text search
    const queryPotentialGINIndexes = `
      SELECT c.table_name, c.column_name
      FROM information_schema.columns c
      JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
      WHERE (c.data_type = 'text[]' OR c.column_name LIKE '%_text')
      AND t.table_schema NOT IN ('pg_catalog', 'information_schema')
      AND t.table_type = 'BASE TABLE';`;

    const resPotentialGIN = await pool.query(queryPotentialGINIndexes);
    for (const row of resPotentialGIN.rows) {
      result.messages.push({text:`Column '${row.column_name}' on table '${row.table_name}' might benefit from a GIN index for improved search performance.`, type: MessageType.Warning});
    }
  } catch (error) {
    console.error('Error during the GIN index analysis:', error);
    result.messages.push({text:'Error during the GIN index analysis.', type: MessageType.Error});
  }

  try {
    // Suggest BRIN indexes for large tables with monotonically increasing columns
    const queryBRINCandidateColumns = `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE data_type IN ('timestamp without time zone', 'timestamp with time zone', 'date', 'integer')
        AND table_schema NOT IN ('pg_catalog', 'information_schema')
        AND table_name NOT IN (
          SELECT DISTINCT indrelid::regclass::text 
          FROM pg_index 
          JOIN pg_class ON pg_class.oid = pg_index.indexrelid 
          WHERE pg_class.relkind = 'i'
        );`;
  
    const resPotentialBRIN  = await pool.query(queryBRINCandidateColumns);
    for (const row of resPotentialBRIN.rows) {
      result.messages.push({text:`Column '${row.column_name}' on table '${row.table_name}' might benefit from a BRIN index for faster queries on large, naturally ordered datasets.`, type: MessageType.Warning});
    }
  } catch (error) {
    console.error('Error during the BRIN index analysis:', error);
    result.messages.push({text:'Error during the BRIN index analysis.', type: MessageType.Error});
  }
   
  try {
    // Suggest GiST indexes for geometric data types
    const queryGiSTCandidateColumns = `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE data_type IN ('point', 'polygon', 'circle');
    `;

    const resPotentialGiST = await pool.query(queryGiSTCandidateColumns);
    for (const row of resPotentialGiST.rows) {
      result.messages.push({text:`Column '${row.column_name}' on table '${row.table_name}' might benefit from a GiST index for efficient geometric operations.`, type: MessageType.Warning});
    }
  } catch (error) {
    console.error('Error during the GiST index analysis:', error);
    result.messages.push({text:'Error during the GiST index analysis.', type: MessageType.Error});
  }

  try{
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

    const resForeignKeys = await pool.query(queryFKColumnsWithoutIndex);
    for (const row of resForeignKeys.rows) {
      result.messages.push({text:`Foreign key column '${row.column_name}' on table '${row.table_schema}.${row.table_name}' is not indexed. Consider adding an index to improve performance.`, type: MessageType.Warning});
    }
  } catch (error) {
    console.error('Error during the foreign key index analysis:', error);
    result.messages.push({text:'Error during the foreign key index analysis.', type: MessageType.Error});
  }

  if (result.messages.length === 0) {
    result.messages.push({text:'No issues found during index analysis.', type: MessageType.Info});
  }
  return result;
}
