// tests/analyseDefaultAccounts.test.ts
import { Pool } from 'pg';
import { analyseDefaultAccounts } from '../src/analyses/analyseDefaultAccounts';
import { AnalysisResult, MessageType } from '../src/types/analysisResult';

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
    const foundMessage = result.messages.some(m => 
      m.text.includes('Found common usernames that may have weak/default passwords: postgres, admin') && m.type === MessageType.Warning
    );
    expect(foundMessage).toBeTruthy();
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
  
  it('should report no common default usernames when none are found', async () => {
    const mockUserData = {
      rows: [],
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockUserData);
  
    const result = await analyseDefaultAccounts(pool);
    const noDefaultUsernamesFoundMessage = result.messages.find(m => 
      m.text === 'No common default usernames found.'
    );
    expect(noDefaultUsernamesFoundMessage).toBeDefined();
    expect(noDefaultUsernamesFoundMessage?.type).toEqual(MessageType.Info);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
  
  it('should handle errors gracefully', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Test error'));
  
    const result = await analyseDefaultAccounts(pool);
    const errorMessage = result.messages.find(m => 
      m.text === 'An error occurred while reviewing default accounts.'
    );
    expect(errorMessage).toBeDefined();
    expect(errorMessage?.type).toEqual(MessageType.Error);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
