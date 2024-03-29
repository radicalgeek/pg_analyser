// tests/analyseDataLength.test.ts
import { Pool } from 'pg';
import { analyseTextAndBinaryDataLength } from '../src/analyses/analyseDataLength';
import { AnalysisResult, MessageType } from '../src/types/analysisResult';

jest.mock('pg', () => {
  const mQuery = jest.fn();
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyseTextAndBinaryDataLength', () => {
  let pool: Pool;
  beforeEach(() => {
    pool = new Pool();
  });

  it('should return analysis result for text and bytea data type columns', async () => {
    const mockColumnsData = {
      rows: [
        { column_name: 'test_text', data_type: 'text', character_maximum_length: null },
        { column_name: 'test_bytea', data_type: 'bytea', character_maximum_length: null },
      ],
    };
    const mockLengthDataText = { rows: [{ max_length: 100 }] };
    const mockLengthDataBytea = { rows: [{ max_length: 100 }] };
    
    (pool.query as jest.Mock)
        .mockResolvedValueOnce(mockColumnsData) // First call for column details
        .mockResolvedValueOnce(mockLengthDataText) // Second call for the 'test_text' column
        .mockResolvedValueOnce(mockLengthDataBytea); // Third call for the 'test_bytea' column

        const result = await analyseTextAndBinaryDataLength(pool, 'test_table');
        expect(result.messages.some(m => m.text.includes('has maximum length of data: 100'))).toBeTruthy();
        expect(pool.query).toHaveBeenCalledTimes(3);
});


  it('should suggest reducing character column length where applicable', async () => {
    const mockColumnsData = {
      rows: [
        { column_name: 'test_char', data_type: 'character varying', character_maximum_length: 255 },
      ],
    };
    const mockLengthData = {
      rows: [{ max_length: 50 }],
    };
    (pool.query as jest.Mock).mockResolvedValueOnce(mockColumnsData).mockResolvedValueOnce(mockLengthData);


    const result = await analyseTextAndBinaryDataLength(pool, 'test_table');
    expect(result.messages.some(m => m.text.includes('could potentially be reduced to 50'))).toBeTruthy();
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('should return "No Issues Found." if no applicable columns', async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] }); 

    const result = await analyseTextAndBinaryDataLength(pool, 'test_table');
    expect(result.messages.some(m => m.text === 'No issues found in table test_table')).toBeTruthy();
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
