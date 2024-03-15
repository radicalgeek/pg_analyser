import { Pool } from 'pg';
import { analysePasswordPolicy } from '../src/analyses/analysePasswordPolicy';

// Mock pg Pool
jest.mock('pg', () => {
  const mPool = {
    query: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analysePasswordPolicy', () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
  });

  it('should detect when passwordcheck and pgaudit are enabled', async () => {
    const mockResponse = {
      rows: [{ shared_preload_libraries: 'passwordcheck,pgaudit' }]
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await analysePasswordPolicy(pool);

    expect(result).toContain('Password policy module (passwordcheck) is enabled');
    expect(result).toContain('Audit logging module (pgAudit) is enabled');
  });

  it('should detect when passwordcheck and pgaudit are not enabled', async () => {
    const mockResponse = {
      rows: [{ shared_preload_libraries: '' }]
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await analysePasswordPolicy(pool);

    expect(result).toContain('Password policy module (passwordcheck) is not enabled');
    expect(result).toContain('Audit logging module (pgAudit) is not enabled');
  });

  it('should handle errors gracefully', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Test Error'));

    const result = await analysePasswordPolicy(pool);

    expect(result).toContain('An error occurred while analysing password policies and security modules.');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
