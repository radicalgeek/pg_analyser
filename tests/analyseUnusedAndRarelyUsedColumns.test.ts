// tests/analyseUnusedAndRarelyUsedColumns.test.ts
import { Pool } from 'pg';
import { analyseUnusedOrRarelyUsedColumns } from '../src/analyses/analyseUnusedAndRarelyUsedColumns';
import { AnalysisResult, MessageType } from '../src/types/analysisResult';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyseUnusedOrRarelyUsedColumns', () => {
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
    expect(result.messages.some(message => message.text.includes('is rarely used or mostly null (3% non-null values)'))).toBeTruthy();
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
    expect(result.messages.some(message => message.text.includes('might be overusing a default value (only 1 unique value across non-null entries)'))).toBeTruthy();
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
    // Here we check for an OK type message with the specific text
    const noIssuesFoundMessage = result.messages.find(m => m.text === 'No issues found in table test_table' && m.type === MessageType.Info);
    expect(noIssuesFoundMessage).toBeDefined();
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.UNUSED_COLUMN_PERCENTAGE_THRESHOLD;
  });
});
