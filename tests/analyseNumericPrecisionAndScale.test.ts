// tests/analyseNumericPrecisionAndScale.test.ts
import { Pool } from 'pg';
import { analyseNumericPrecisionAndScale } from '../src/analyses/analyseNumericPositionAndScale';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyseNumericPrecisionAndScale', () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
  });

  it('should suggest precision and scale optimisations for numeric columns', async () => {
    const mockColumnDetails = {
      rows: [
        { column_name: 'amount', numeric_precision: 10, numeric_scale: 2 }
      ],
    };
    const mockMaxPrecisionAndScale = {
      rows: [{ max_precision: 5, max_scale: 1 }]
    };

    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnDetails) // Mock response for column details
      .mockResolvedValueOnce(mockMaxPrecisionAndScale); // Mock response for precision and scale calculation

    const result = await analyseNumericPrecisionAndScale(pool, 'financials');
    expect(result.messages.some(message => message.includes('has defined numeric precision of 10 which could potentially be reduced to 5')));
    expect(result.messages.some(message => message.includes('has defined numeric scale of 2 which could potentially be reduced to 1')))
    expect(pool.query).toHaveBeenCalledTimes(2);
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

    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnDetails) // Mock response for column details
      .mockResolvedValueOnce(mockMaxPrecisionAndScale); // Mock response for precision and scale calculation

    const result = await analyseNumericPrecisionAndScale(pool, 'financials');
    expect(result.messages).not.toContain('which could potentially be reduced');
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('should return "No Issues Found." if no numeric or decimal columns are present', async () => {
    const mockColumnDetails = {
      rows: []
    };

    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnDetails); // Mock response for column details with no matching columns

    const result = await analyseNumericPrecisionAndScale(pool, 'empty_table');
    expect(result.messages.some(message => message.includes('No Issues Found.')));
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
