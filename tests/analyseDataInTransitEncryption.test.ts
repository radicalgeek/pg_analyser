import { Pool } from 'pg';
import { analyseDataInTransitEncryption } from '../src/analyses/analyseDataInTransitEncryption';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyseDataInTransitEncryption', () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
  });

  it('should report SSL is enabled when the database has SSL on', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ ssl: 'on' }] });
    const result = await analyseDataInTransitEncryption(pool);
    expect(result.messages).toContain('SSL is enabled, suggesting data-in-transit is encrypted.');
  });

  it('should report SSL is not enabled when the database has SSL off', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ ssl: 'off' }] });
    const result = await analyseDataInTransitEncryption(pool);
    expect(result.messages).toContain('SSL is not enabled. Consider enabling SSL to encrypt data-in-transit.');
  });

  it('should handle errors during the SSL check gracefully', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Query failed'));
    const result = await analyseDataInTransitEncryption(pool);
    expect(result.messages).toContain('An error occurred while analysing data-in-transit encryption.');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
