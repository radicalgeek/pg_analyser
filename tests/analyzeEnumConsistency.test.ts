// tests/analyzeEnumConsistency.test.ts
import { Client } from 'pg';
import { analyzePotentialEnumColumns } from '../src/analyses/analyseEnumConsistency';

jest.mock('pg', () => {
  const mClient = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mClient) };
});

describe('analyzePotentialEnumColumns', () => {
  let client: Client;
  
  beforeEach(() => {
    client = new Client();
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

    (client.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData) // First call for column details
      .mockResolvedValueOnce(mockDistinctValuesData); // Second call for distinct values count

    const result = await analyzePotentialEnumColumns(client, 'order_status');
    expect(result).toContain('might be better represented as an enum type');
    expect(client.query).toHaveBeenCalledTimes(2);
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

    (client.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData) // First call for column details
      .mockResolvedValueOnce(mockDistinctValuesData); // Second call for distinct values count

    const result = await analyzePotentialEnumColumns(client, 'product_info');
    expect(result).not.toContain('might be better represented as an enum type');
    expect(client.query).toHaveBeenCalledTimes(2);
  });

  it('should return "No Issues Found." if no columns meet criteria', async () => {
    const mockColumnsData = {
      rows: [], // No columns returned
    };

    (client.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData);

    const result = await analyzePotentialEnumColumns(client, 'empty_table');
    expect(result).toContain('No Issues Found.');
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.ENUM_THRESHOLD;
  });
});
