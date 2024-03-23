import { Pool } from 'pg';
import { analyseDataAtRestEncryption } from '../src/analyses/analyseDataAtRestEncryption';
import { AnalysisResult, MessageType } from '../src/types/analysisResult';

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
    const pgcryptoMessage = result.messages.find(m => 
      m.text.includes('The pgcrypto extension is installed, suggesting some level of column-level encryption may be in use.')
    );
    
    expect(pgcryptoMessage).toBeDefined();
    expect(pgcryptoMessage?.type).toEqual(MessageType.Info);
  });

  it('should indicate pgcrypto extension is not installed', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });
    const result = await analyseDataAtRestEncryption(pool);
    
    const pgcryptoNotInstalledMessage = result.messages.find(m => 
      m.text.includes('The pgcrypto extension is not installed. Consider using pgcrypto for column-level encryption or ensure filesystem-level encryption is enabled.')
    );
    
    expect(pgcryptoNotInstalledMessage).toBeDefined();
    expect(pgcryptoNotInstalledMessage?.type).toEqual(MessageType.Warning); 
  });
  
  it('should handle errors gracefully', async () => {
    (pool.query as jest.Mock).mockRejectedValue(new Error('Query failed'));
    const result = await analyseDataAtRestEncryption(pool);
    
    const errorMessage = result.messages.find(m => 
      m.text.includes('An error occurred while analysing data-at-rest encryption:')
    );
    
    expect(errorMessage).toBeDefined();
    expect(errorMessage?.type).toEqual(MessageType.Error);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
