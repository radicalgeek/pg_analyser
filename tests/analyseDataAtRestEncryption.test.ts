import { Pool } from 'pg';
import { analyseDataAtRestEncryption } from '../src/analyses/analyseDataAtRestEncryption';
import { AnalysisResult } from '../src/types/analysisResult';

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
    expect(result.messages).toContain('The pgcrypto extension is installed, suggesting some level of column-level encryption may be in use.');
  });

  it('should indicate pgcrypto extension is not installed', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
    const result = await analyseDataAtRestEncryption(pool);
    expect(result.messages).toContain('The pgcrypto extension is not installed. Consider using pgcrypto for column-level encryption or ensure filesystem-level encryption is enabled.');
  });

  it('should handle errors gracefully', async () => {
    (pool.query as jest.Mock).mockRejectedValue(new Error('Query failed'));
    const result = await analyseDataAtRestEncryption(pool);
    expect(result.messages).toContain('An error occurred while analysing data-at-rest encryption:');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
