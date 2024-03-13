// tests/analyzeTemporalAppropriateness.test.ts
import { Pool } from 'pg';
import { analyseTemporalDataTypeAppropriateness } from '../src/analyses/analyseTemporalAppropriateness';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyzeTemporalDataTypeAppropriateness', () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
  });

  it('should suggest time zone awareness for columns defined without time zone', async () => {
    const mockColumnsData = {
      rows: [
        { column_name: 'created_at', data_type: 'timestamp without time zone' },
      ],
    };

    (pool.query as jest.Mock).mockResolvedValueOnce(mockColumnsData);

    const result = await analyseTemporalDataTypeAppropriateness(pool, 'events');
    expect(result).toContain("Consider if 'with time zone' might be more appropriate for time zone awareness");
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('should not suggest changes for columns already defined with time zone', async () => {
    const mockColumnsData = {
      rows: [
        { column_name: 'created_at', data_type: 'timestamp with time zone' },
      ],
    };

    (pool.query as jest.Mock).mockResolvedValueOnce(mockColumnsData);

    const result = await analyseTemporalDataTypeAppropriateness(pool, 'events');
    expect(result).not.toContain("Consider if 'with time zone' might be more appropriate for time zone awareness");
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('should return "No Issues Found." if no temporal columns are present', async () => {
    const mockColumnsData = {
      rows: [],
    };

    (pool.query as jest.Mock).mockResolvedValueOnce(mockColumnsData);

    const result = await analyseTemporalDataTypeAppropriateness(pool, 'empty_table');
    expect(result).toContain('No Issues Found.');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
