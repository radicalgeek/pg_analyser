// tests/analyseNumberAndDatesInStrings.test.ts
import { Pool } from 'pg';
import { analyseColumnDataTypes } from '../src/analyses/analyseColumnDataTypes';
import { AnalysisResult, MessageType } from '../src/types/analysisResult';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyseNumberDateBooleanInStringOrNumberColumns', () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
  });

  it('should identify columns storing numbers as text', async () => {
    const mockColumnsData = {
      rows: [{ column_name: 'numeric_column', data_type: 'character varying' }],
    };
    const mockRowsData = {
      rows: [{ numeric_column: '123' }, { numeric_column: '456' }],
    };

    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData) // First call for column details
      .mockResolvedValueOnce(mockRowsData); // Second call for column data

    const result = await analyseColumnDataTypes(pool, 'test_table');
    // Adjust based on how messages are structured
    const hasExpectedMessage = result.messages.some(message => message.text.includes(`Column 'numeric_column' in table 'test_table' might be better as a numeric or date type.`) && message.type === MessageType.Warning);
    expect(hasExpectedMessage).toBeTruthy();
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('should identify columns storing dates as text', async () => {
    const mockColumnsData = {
      rows: [{ column_name: 'date_column', data_type: 'character varying' }],
    };
    const mockRowsData = {
      rows: [{ date_column: '2020-01-01' }, { date_column: '2021-01-01' }],
    };
  
    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData) // First call for column details
      .mockResolvedValueOnce(mockRowsData); // Second call for column data
  
    const result = await analyseColumnDataTypes(pool, 'test_table');
    expect(result.messages.some(message => message.text.includes('might be better as a numeric or date type'))).toBeTruthy();
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
  
  it('should report no issues found if no columns meet criteria', async () => {
    const mockColumnsData = {
      rows: [{ column_name: 'mixed_column', data_type: 'character varying' }],
    };
    const mockRowsData = {
      rows: [{ mixed_column: '123' }, { mixed_column: 'abc' }, { mixed_column: '2020-01-01' }],
    };
  
    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData) // First call for column details
      .mockResolvedValueOnce(mockRowsData); // Second call for column data
  
    const result = await analyseColumnDataTypes(pool, 'test_table');
    expect(result.messages.some(message => message.text === 'No issues found in table test_table')).toBeTruthy();
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
  
  it('should identify string columns that might be better as a boolean type', async () => {
    const mockColumnsData = {
      rows: [{ column_name: 'bool_string_column', data_type: 'character varying' }],
    };
    const mockRowsDataForStringBool = {
      rows: [{ bool_string_column: 'true' }, { bool_string_column: 'false' }],
    };
  
    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsData) // First call for column details
      .mockResolvedValueOnce(mockRowsDataForStringBool); // Second call for column data
  
    const result = await analyseColumnDataTypes(pool, 'test_table');
    expect(result.messages.some(message => message.text.includes('might be better as a boolean type'))).toBeTruthy();
    expect(pool.query).toHaveBeenCalledTimes(2);
  });
  
  it('should identify numeric columns that might be better as a boolean type', async () => {
    const mockColumnsDataForNumericBool = {
      rows: [{ column_name: 'bool_numeric_column', data_type: 'integer' }],
    };
    const mockRowsDataForNumericBool = {
      rows: [{ bool_numeric_column: 1 }, { bool_numeric_column: 0 }],
    };
  
    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockColumnsDataForNumericBool) // First call for column details
      .mockResolvedValueOnce(mockRowsDataForNumericBool); // Second call for column data
  
    const result = await analyseColumnDataTypes(pool, 'test_table');
    expect(result.messages.some(message => message.text.includes('Numeric column \'bool_numeric_column\' in table \'test_table\' might be better as a boolean type (contains only 0 and 1)'))).toBeTruthy();
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
