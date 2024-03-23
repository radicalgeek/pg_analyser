// tests/analyseTemporalAppropriateness.test.ts
import { Pool } from 'pg';
import { analyseTemporalDataTypeAppropriateness } from '../src/analyses/analyseTemporalAppropriateness';
import { AnalysisResult, MessageType } from '../src/types/analysisResult';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyseTemporalDataTypeAppropriateness', () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
  });

  it('should suggest time zone awareness for columns defined without time zone', async () => {
    const mockColumnsData = {
      rows: [
        { column_name: 'created_at', data_type: 'timestamp without time zone' },
      ],
    };
  
    (pool.query as jest.Mock).mockResolvedValueOnce(mockColumnsData);
  
    const result = await analyseTemporalDataTypeAppropriateness(pool, 'events');
    const timeZoneMessage = result.messages.find(m => 
      m.text.includes("Consider if 'with time zone' might be more appropriate for time zone awareness")
    );
    
    expect(timeZoneMessage).toBeDefined();
    expect(timeZoneMessage?.type).toEqual(MessageType.Warning); // Adjust based on your actual expected message type
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
  
  it('should not suggest changes for columns already defined with time zone', async () => {
    const mockColumnsData = {
      rows: [
        { column_name: 'created_at', data_type: 'timestamp with time zone' },
      ],
    };
  
    (pool.query as jest.Mock).mockResolvedValueOnce(mockColumnsData);
  
    const result = await analyseTemporalDataTypeAppropriateness(pool, 'events');
    expect(result.messages.some(m => 
      m.text.includes("Consider if 'with time zone' might be more appropriate for time zone awareness") && m.type === MessageType.Warning
    )).toBe(false);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
  
  it('should return "No Issues Found." if no temporal columns are present', async () => {
    const mockColumnsData = {
      rows: [],
    };
  
    (pool.query as jest.Mock).mockResolvedValueOnce(mockColumnsData);
  
    const result = await analyseTemporalDataTypeAppropriateness(pool, 'empty_table');
    const noIssuesMessage = result.messages.find(m => m.text.includes('No issues found in table empty_table'));
    
    expect(noIssuesMessage).toBeDefined();
    expect(noIssuesMessage?.type).toEqual(MessageType.Info); // Or however you decide to classify "No Issues Found." messages
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
