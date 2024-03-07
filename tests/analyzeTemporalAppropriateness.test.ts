// tests/analyzeTemporalAppropriateness.test.ts
import { Client } from 'pg';
import { analyzeTemporalDataTypeAppropriateness } from '../src/analyses/analyseTemporalAppropriateness';

jest.mock('pg', () => {
  const mClient = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mClient) };
});

describe('analyzeTemporalDataTypeAppropriateness', () => {
  let client: Client;

  beforeEach(() => {
    client = new Client();
  });

  it('should suggest time zone awareness for columns defined without time zone', async () => {
    const mockColumnsData = {
      rows: [
        { column_name: 'created_at', data_type: 'timestamp without time zone' },
      ],
    };

    (client.query as jest.Mock).mockResolvedValueOnce(mockColumnsData);

    const result = await analyzeTemporalDataTypeAppropriateness(client, 'events');
    expect(result).toContain("Consider if 'with time zone' might be more appropriate for time zone awareness");
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it('should not suggest changes for columns already defined with time zone', async () => {
    const mockColumnsData = {
      rows: [
        { column_name: 'created_at', data_type: 'timestamp with time zone' },
      ],
    };

    (client.query as jest.Mock).mockResolvedValueOnce(mockColumnsData);

    const result = await analyzeTemporalDataTypeAppropriateness(client, 'events');
    expect(result).not.toContain("Consider if 'with time zone' might be more appropriate for time zone awareness");
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it('should return "No Issues Found." if no temporal columns are present', async () => {
    const mockColumnsData = {
      rows: [],
    };

    (client.query as jest.Mock).mockResolvedValueOnce(mockColumnsData);

    const result = await analyzeTemporalDataTypeAppropriateness(client, 'empty_table');
    expect(result).toContain('No Issues Found.');
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
