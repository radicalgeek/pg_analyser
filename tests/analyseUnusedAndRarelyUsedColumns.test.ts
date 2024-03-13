// tests/analyzeUnusedAndRarelyUsedColumns.test.ts
import { Pool } from 'pg';
import { analyseUnusedOrRarelyUsedColumns } from '../src/analyses/analyseUnusedAndRarelyUsedColumns';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyzeUnusedOrRarelyUsedColumns', () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
    process.env.UNUSED_COLUMN_PERCENTAGE_THRESHOLD = '5'; // Example threshold for testing
  });

  it('should identify unused or rarely used columns based on non-null percentage', async () => {
    const mockColumnsData = {
      rows: [{ column_name: 'unused_column' }],
    };
    const mockColumnUsageData = {
      rows: [{ total_rows: 100, non_null_rows: 3, non_null_percentage: 3, unique_values: 1 }],
    };

    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData) // Mock response for column details
      .mockResolvedValueOnce(mockColumnUsageData); // Mock response for column usage

    const result = await analyseUnusedOrRarelyUsedColumns(pool, 'test_table');
    expect(result).toContain('is rarely used or mostly null (3% non-null values)');
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('should identify columns overusing a default value', async () => {
    const mockColumnsData = {
      rows: [{ column_name: 'default_value_column' }],
    };
    const mockColumnUsageData = {
      rows: [{ total_rows: 100, non_null_rows: 100, non_null_percentage: 100, unique_values: 1 }],
    };

    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData) // Mock response for column details
      .mockResolvedValueOnce(mockColumnUsageData); // Mock response for column usage

    const result = await analyseUnusedOrRarelyUsedColumns(pool, 'test_table');
    expect(result).toContain('might be overusing a default value (only 1 unique value across non-null entries)');
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('should return "No Issues Found." if all columns are used appropriately', async () => {
    const mockColumnsData = {
      rows: [{ column_name: 'active_column' }],
    };
    const mockColumnUsageData = {
      rows: [{ total_rows: 100, non_null_rows: 100, non_null_percentage: 100, unique_values: 10 }],
    };

    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData) // Mock response for column details
      .mockResolvedValueOnce(mockColumnUsageData); // Mock response for column usage

    const result = await analyseUnusedOrRarelyUsedColumns(pool, 'test_table');
    expect(result).toContain('No Issues Found.');
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.UNUSED_COLUMN_PERCENTAGE_THRESHOLD;
  });
});
