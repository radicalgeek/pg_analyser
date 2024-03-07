// tests/analyzeNumberAndDatesInStrings.test.ts
import { Client } from 'pg';
import { analyzeNumberInStringColumns } from '../src/analyses/analyseNumberAndDatesInStrings';

jest.mock('pg', () => {
  const mClient = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mClient) };
});

describe('analyzeNumberInStringColumns', () => {
  let client: Client;

  beforeEach(() => {
    client = new Client();
  });

  it('should identify columns storing numbers as text', async () => {
    const mockColumnsData = {
      rows: [{ column_name: 'numeric_column' }],
    };
    const mockRowsData = {
      rows: [{ numeric_column: '123' }, { numeric_column: '456' }],
    };

    (client.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData) // First call for column details
      .mockResolvedValueOnce(mockRowsData); // Second call for column data

    const result = await analyzeNumberInStringColumns(client, 'test_table');
    expect(result).toContain('might be better as a numeric or date type');
    expect(client.query).toHaveBeenCalledTimes(2);
  });

  it('should identify columns storing dates as text', async () => {
    const mockColumnsData = {
      rows: [{ column_name: 'date_column' }],
    };
    const mockRowsData = {
      rows: [{ date_column: '2020-01-01' }, { date_column: '2021-01-01' }],
    };

    (client.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData) // First call for column details
      .mockResolvedValueOnce(mockRowsData); // Second call for column data

    const result = await analyzeNumberInStringColumns(client, 'test_table');
    expect(result).toContain('might be better as a numeric or date type');
    expect(client.query).toHaveBeenCalledTimes(2);
  });

  it('should report no issues found if no columns meet criteria', async () => {
    const mockColumnsData = {
      rows: [{ column_name: 'mixed_column' }],
    };
    const mockRowsData = {
      rows: [{ mixed_column: '123' }, { mixed_column: 'abc' }, { mixed_column: '2020-01-01' }],
    };

    (client.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData) // First call for column details
      .mockResolvedValueOnce(mockRowsData); // Second call for column data

    const result = await analyzeNumberInStringColumns(client, 'test_table');
    expect(result).toContain('No Issues Found.');
    expect(client.query).toHaveBeenCalledTimes(2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
