import { Pool } from 'pg';
import { analyseSensitiveDataExposure } from '../src/analyses/analyseSensitiveDataExposure';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyseSensitiveDataExposure', () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
  });

  it('should identify potential sensitive columns', async () => {
    const mockData = {
      rows: [
        { table_name: 'user_accounts', column_name: 'password' },
        { table_name: 'api_keys', column_name: 'api_key' },
      ],
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockData);
  
    const result = await analyseSensitiveDataExposure(pool);
  
    const passwordMessage = result.messages.find(m => m.text.includes('Potential sensitive column found: user_accounts.password'));
    const apiKeyMessage = result.messages.find(m => m.text.includes('Potential sensitive column found: api_keys.api_key'));
  
    expect(passwordMessage).toBeDefined();
    expect(apiKeyMessage).toBeDefined();
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
  
  it('should handle no sensitive columns found', async () => {
    const mockData = { rows: [] };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockData);
  
    const result = await analyseSensitiveDataExposure(pool);
  
    const noSensitiveColumnsMessage = result.messages.find(m => m.text.includes('No obvious sensitive information columns found.'));
    expect(noSensitiveColumnsMessage).toBeDefined();
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
  
  it('should handle errors gracefully', async () => {
    const error = new Error('Test Error');
    (pool.query as jest.Mock).mockRejectedValueOnce(error);
  
    const result = await analyseSensitiveDataExposure(pool);
  
    const errorMessage = result.messages.find(m => m.text.includes('An error occurred while analysing for exposed sensitive information.'));
    expect(errorMessage).toBeDefined();
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
