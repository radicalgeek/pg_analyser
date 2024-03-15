// tests/analyseDefaultAccounts.test.ts
import { Pool } from 'pg';
import { analyseDefaultAccounts } from '../src/analyses/analyseDefaultAccounts';

// Mock the pg Pool class
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyseDefaultAccounts', () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
  });

  it('should identify common default usernames', async () => {
    const mockUserData = {
      rows: [{ username: 'postgres' }, { username: 'admin' }],
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockUserData);

    const result = await analyseDefaultAccounts(pool);
    expect(result).toContain('Found common usernames that may have weak/default passwords: postgres, admin');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('should report no common default usernames when none are found', async () => {
    const mockUserData = {
      rows: [],
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockUserData);

    const result = await analyseDefaultAccounts(pool);
    expect(result).toContain('No common default usernames found');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('should handle errors gracefully', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

    const result = await analyseDefaultAccounts(pool);
    expect(result).toContain('An error occurred while reviewing default accounts');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
