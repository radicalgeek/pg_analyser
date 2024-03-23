import { Pool } from 'pg';
import { analysePasswordPolicy } from '../src/analyses/analysePasswordPolicy';
import { AnalysisResult, MessageType } from '../src/types/analysisResult';

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
  
    const passwordcheckEnabled = result.messages.find(message => 
      message.text.includes('Password policy module (passwordcheck) is enabled')
    );
    const pgauditEnabled = result.messages.find(message => 
      message.text.includes('Audit logging module (pgAudit) is enabled')
    );
  
    expect(passwordcheckEnabled).toBeDefined();
    expect(pgauditEnabled).toBeDefined();
  });
  
  it('should detect when passwordcheck and pgaudit are not enabled', async () => {
    const mockResponse = {
      rows: [{ shared_preload_libraries: '' }]
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockResponse);
  
    const result = await analysePasswordPolicy(pool);
  
    const passwordcheckNotEnabled = result.messages.find(message => 
      message.text.includes('Password policy module (passwordcheck) is not enabled')
    );
    const pgauditNotEnabled = result.messages.find(message => 
      message.text.includes('Audit logging module (pgAudit) is not enabled')
    );
  
    expect(passwordcheckNotEnabled).toBeDefined();
    expect(pgauditNotEnabled).toBeDefined();
  });
  
  it('should handle errors gracefully', async () => {
    (pool.query as jest.Mock).mockRejectedValueOnce(new Error('Test Error'));
  
    const result = await analysePasswordPolicy(pool);
  
    const errorMessage = result.messages.find(message =>
      message.text.includes('An error occurred while analysing password policies and security modules.')
    );
  
    expect(errorMessage).toBeDefined();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
