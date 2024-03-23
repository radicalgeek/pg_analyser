// tests/analyseSuperuserAccess.test.ts
import { Pool } from 'pg';
import { analyseSuperuserAccess } from '../src/analyses/analyseSuperuserAccess';
import { AnalysisResult, MessageType } from '../src/types/analysisResult';

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
    const superusersMessage = result.messages.find(m => 
      m.text.includes('Found multiple superuser accounts: superuser1, superuser2.')
    );
    expect(superusersMessage).toBeDefined();
    expect(superusersMessage?.type).toEqual(MessageType.Warning);
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
    // Assuming you add a generic success message when there's no issue found
    expect(result.messages.some(m => m.text === 'No issues found.' && m.type === MessageType.Info)).toBeTruthy();
  });
  
  it('should return an error message on failure', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Query failed'));
  
    const result = await analyseSuperuserAccess(pool);
  
    expect(pool.query).toHaveBeenCalledWith(expect.any(String));
    const errorMessage = result.messages.find(m => 
      m.text.includes('Error during superuser access analysis: Error: Query failed')
    );
    expect(errorMessage).toBeDefined();
    expect(errorMessage?.type).toEqual(MessageType.Error);
  });
});
