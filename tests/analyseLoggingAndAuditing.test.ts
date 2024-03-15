// tests/analyseLoggingAndAuditing.test.ts
import { Pool } from 'pg';
import { analyseLoggingAndAuditing } from '../src/analyses/analyseLoggingAndAuditing';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyseLoggingAndAuditing', () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
    (pool.query as jest.Mock).mockReset();
  });

  it('should correctly analyse logging and auditing settings', async () => {
    // Setup mock to return different settings for each query call
    const mockSettings = [
      { name: 'log_connections', setting: 'on' },
      { name: 'log_disconnections', setting: 'on' }
    ];

    mockSettings.forEach((setting, index) => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [setting], rowCount: 1 });
    });

    const result = await analyseLoggingAndAuditing(pool);

    // Ensure all logging settings are queried and analysed correctly
    mockSettings.forEach(setting => {
      expect(result).toContain(`${setting.name}: ${setting.setting}`);
    });

    expect(pool.query).toHaveBeenCalledTimes(mockSettings.length +1);
  });

  it('should handle missing settings gracefully', async () => {
    (pool.query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });

    const result = await analyseLoggingAndAuditing(pool);

    expect(result).toContain('Not found');
    expect(pool.query).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    (pool.query as jest.Mock).mockRejectedValue(new Error('Test error'));

    const result = await analyseLoggingAndAuditing(pool);

    expect(result).toContain('An error occurred while analysing logging and auditing settings.');
    expect(pool.query).toHaveBeenCalled();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
