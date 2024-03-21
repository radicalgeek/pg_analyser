// tests/analyseEnumConsistency.test.ts
import { Pool } from 'pg';
import { analysePotentialEnumColumns } from '../src/analyses/analyseEnumConsistency';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analysePotentialEnumColumns', () => {
  let pool: Pool;
  
  beforeEach(() => {
    pool = new Pool();
    process.env.ENUM_THRESHOLD = '5'; // Set the threshold for testing
  });

  it('should identify columns suitable for enum representation', async () => {
    const mockColumnsData = {
      rows: [
        { column_name: 'status' },
      ],
    };
    const mockDistinctValuesData = {
      rowCount: 3, // Assume 3 distinct values
    };

    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData) // First call for column details
      .mockResolvedValueOnce(mockDistinctValuesData); // Second call for distinct values count

    const result = await analysePotentialEnumColumns(pool, 'order_status');
    expect(result.messages.some(message => message.includes('might be better represented as an enum type')));
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('should not suggest enum for columns with distinct values exceeding the threshold', async () => {
    const mockColumnsData = {
      rows: [
        { column_name: 'description' },
      ],
    };
    const mockDistinctValuesData = {
      rowCount: 10, // Assume 10 distinct values, exceeding the threshold
    };

    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData) // First call for column details
      .mockResolvedValueOnce(mockDistinctValuesData); // Second call for distinct values count

    const result = await analysePotentialEnumColumns(pool, 'product_info');
    expect(result.messages).not.toContain('might be better represented as an enum type');
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('should return "No Issues Found." if no columns meet criteria', async () => {
    const mockColumnsData = {
      rows: [], // No columns returned
    };

    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData);

    const result = await analysePotentialEnumColumns(pool, 'empty_table');
    expect(result.messages).toContain('No Issues Found.');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.ENUM_THRESHOLD;
  });
});
