// tests/analyzeNumericPrecisionAndScale.test.ts
import { Client } from 'pg';
import { analyzeNumericPrecisionAndScale } from '../src/analyses/analyseNumericPositionAndScale';

jest.mock('pg', () => {
  const mClient = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mClient) };
});

describe('analyzeNumericPrecisionAndScale', () => {
  let client: Client;

  beforeEach(() => {
    client = new Client();
  });

  it('should suggest precision and scale optimizations for numeric columns', async () => {
    const mockColumnDetails = {
      rows: [
        { column_name: 'amount', numeric_precision: 10, numeric_scale: 2 }
      ],
    };
    const mockMaxPrecisionAndScale = {
      rows: [{ max_precision: 5, max_scale: 1 }]
    };

    (client.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnDetails) // Mock response for column details
      .mockResolvedValueOnce(mockMaxPrecisionAndScale); // Mock response for precision and scale calculation

    const result = await analyzeNumericPrecisionAndScale(client, 'financials');
    expect(result).toContain('has defined numeric precision of 10 which could potentially be reduced to 5');
    expect(result).toContain('has defined numeric scale of 2 which could potentially be reduced to 1');
    expect(client.query).toHaveBeenCalledTimes(2);
  });

  it('should not suggest changes if current precision and scale are optimal', async () => {
    const mockColumnDetails = {
      rows: [
        { column_name: 'amount', numeric_precision: 5, numeric_scale: 1 }
      ],
    };
    const mockMaxPrecisionAndScale = {
      rows: [{ max_precision: 5, max_scale: 1 }]
    };

    (client.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnDetails) // Mock response for column details
      .mockResolvedValueOnce(mockMaxPrecisionAndScale); // Mock response for precision and scale calculation

    const result = await analyzeNumericPrecisionAndScale(client, 'financials');
    expect(result).not.toContain('which could potentially be reduced');
    expect(client.query).toHaveBeenCalledTimes(2);
  });

  it('should return "No Issues Found." if no numeric or decimal columns are present', async () => {
    const mockColumnDetails = {
      rows: []
    };

    (client.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnDetails); // Mock response for column details with no matching columns

    const result = await analyzeNumericPrecisionAndScale(client, 'empty_table');
    expect(result).toContain('No Issues Found.');
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
