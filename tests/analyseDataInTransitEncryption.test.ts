import { Pool } from 'pg';
import { analyseDataInTransitEncryption } from '../src/analyses/analyseDataInTransitEncryption';
import { AnalysisResult, MessageType } from '../src/types/analysisResult';

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
    
    // Find the specific message object
    const sslEnabledMessage = result.messages.find(m => 
      m.text.includes('SSL is enabled, suggesting data-in-transit is encrypted.')
    );
    
    expect(sslEnabledMessage).toBeDefined();
    expect(sslEnabledMessage?.type).toEqual(MessageType.Info);
  });
  
  it('should report SSL is not enabled when the database has SSL off', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [{ ssl: 'off' }] });
    const result = await analyseDataInTransitEncryption(pool);
    
    // Find the specific message object
    const sslNotEnabledMessage = result.messages.find(m => 
      m.text.includes('SSL is not enabled. Consider enabling SSL to encrypt data-in-transit.')
    );
    
    expect(sslNotEnabledMessage).toBeDefined();
    expect(sslNotEnabledMessage?.type).toEqual(MessageType.Warning);
  });
  
  it('should handle errors during the SSL check gracefully', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Query failed'));
    const result = await analyseDataInTransitEncryption(pool);
    
    // Find the specific error message object
    const errorMessage = result.messages.find(m => 
      m.text.includes('An error occurred while analysing data-in-transit encryption.')
    );
    
    expect(errorMessage).toBeDefined();
    expect(errorMessage?.type).toEqual(MessageType.Error);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
