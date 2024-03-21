// tests/analyseIndexUsage.test.ts
import { Pool } from 'pg';
import { analyseIndexUsageAndTypes } from '../src/analyses/analyseIndexUsage';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyseIndexUsageAndTypes', () => {
  let pool: Pool;
  
  beforeEach(() => {
    pool = new Pool();
    process.env.UNUSED_INDEX_THRESHOLD = '50'; // Example threshold for unused indexes
  });

  it('should identify unused, duplicate, and suggest GIN, BRIN, GiST indexes, and check for unindexed foreign keys', async () => {
    const mockUnusedIndexesData = {
      rows: [{ table_name: 'test_table', index_name: 'test_idx', index_scans: 10 }],
    };
    const mockDuplicateIndexesData = {
      rows: [{ table: 'test_table', duplicate_indexes: ['test_idx_1', 'test_idx_2'], count: 2 }],
    };
    const mockPotentialGINData = {
      rows: [{ table_name: 'test_table', column_name: 'test_text' }],
    };
    const mockPotentialBRINData = {
      rows: [{ table_name: 'test_table', column_name: 'test_date' }],
    };
    const mockPotentialGiSTData = {
      rows: [{ table_name: 'test_table', column_name: 'test_point' }],
    };
    const mockFKColumnsWithoutIndexData = {
      rows: [{ table_schema: 'public', table_name: 'test_table', column_name: 'test_fk' }],
    };

    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockUnusedIndexesData) // For unused indexes
      .mockResolvedValueOnce(mockDuplicateIndexesData) // For duplicate indexes
      .mockResolvedValueOnce(mockPotentialGINData) // For potential GIN indexes
      .mockResolvedValueOnce(mockPotentialBRINData) // For potential BRIN indexes
      .mockResolvedValueOnce(mockPotentialGiSTData) // For potential GiST indexes
      .mockResolvedValueOnce(mockFKColumnsWithoutIndexData); // For FK columns without index

    const result = await analyseIndexUsageAndTypes(pool);

    expect(result.messages.some(message => message.includes('has very low usage')));
    expect(result.messages.some(message => message.includes('Duplicate indexes found')));
    expect(result.messages.some(message => message.includes('might benefit from a GIN index')));
    expect(result.messages.some(message => message.includes('might benefit from a BRIN index')));
    expect(result.messages.some(message => message.includes('might benefit from a GiST index')));
    expect(result.messages.some(message => message.includes('is not indexed. Consider adding an index')));
    expect(pool.query).toHaveBeenCalledTimes(6);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.UNUSED_INDEX_THRESHOLD;
  });
});
