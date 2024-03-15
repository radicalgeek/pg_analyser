// tests/analyseSuperuserAccess.test.ts
import { Pool } from 'pg';
import { analyseSuperuserAccess } from '../src/analyses/analyseSuperuserAccess';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyseSuperuserAccess', () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should identify multiple superuser accounts and suggest a review', async () => {
    const mockSuperusers = {
      rows: [
        { username: 'superuser1' },
        { username: 'superuser2' },
      ],
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockSuperusers);

    const result = await analyseSuperuserAccess(pool);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String));
    expect(result).toContain('Found multiple superuser accounts: superuser1, superuser2.');
  });

  it('should handle no extra superuser accounts gracefully', async () => {
    const mockSuperusers = {
      rows: [
        { username: 'superuser1' },
      ],
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockSuperusers);

    const result = await analyseSuperuserAccess(pool);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String));
    expect(result).toContain('No Issues Found.');
  });

  it('should return an error message on failure', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Query failed'));

    const result = await analyseSuperuserAccess(pool);

    expect(pool.query).toHaveBeenCalledWith(expect.any(String));
    expect(result).toContain('Error during superuser access analysis: Error: Query failed');
  });
});
