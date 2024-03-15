import { Pool } from 'pg';
import { analyseDataAtRestEncryption } from '../src/analyses/analyseDataAtRestEncryption';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyseDataAtRestEncryption', () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
  });

  it('should indicate pgcrypto extension is installed', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ extname: 'pgcrypto' }] });
    const result = await analyseDataAtRestEncryption(pool);
    expect(result).toContain('The pgcrypto extension is installed');
  });

  it('should indicate pgcrypto extension is not installed', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
    const result = await analyseDataAtRestEncryption(pool);
    expect(result).toContain('The pgcrypto extension is not installed');
  });

  it('should handle errors gracefully', async () => {
    (pool.query as jest.Mock).mockRejectedValue(new Error('Query failed'));
    const result = await analyseDataAtRestEncryption(pool);
    expect(result).toContain('An error occurred while analysing data-at-rest encryption:');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
