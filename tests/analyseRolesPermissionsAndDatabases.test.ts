import { Pool } from 'pg';
import { analyseRolesPermissionsAndDatabases } from '../src/analyses/analyseRolesPermissionsAndDatabases';
import { AnalysisResult, MessageType } from '../src/types/analysisResult';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn()
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('analyseRolesPermissionsAndDatabases', () => {
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should analyse roles, permissions, and database access correctly', async () => {
    const mockRoles = {
      rows: [
        { rolname: 'test_user', rolsuper: false, rolcreaterole: false, rolcreatedb: false, rolcanlogin: true, oid: 1 }
      ]
    };
    const mockDatabases = {
      rows: [
        { datname: 'test_db' }
      ]
    };
    const mockPermissions = {
      rows: [
        { schema: 'public', object: 'test_table', type: 'r', privileges: '{SELECT,INSERT}' }
      ]
    };
  
    (pool.query as jest.Mock)
      .mockResolvedValueOnce(mockRoles) // For queryRoles
      .mockResolvedValueOnce(mockDatabases) // For queryDatabases for each role
      .mockResolvedValueOnce(mockPermissions); // For queryPermissions for each role
  
    const result = await analyseRolesPermissionsAndDatabases(pool);
  
    // Use `.some()` to check if at least one message matches the expected text
    expect(result.messages.some(m => m.text.includes('Role: test_user'))).toBe(true);
    expect(result.messages.some(m => m.text.includes('Accessible Databases: test_db'))).toBe(true);
    expect(result.messages.some(m => m.text.includes('- Permissions on public.test_table (r): SELECT, INSERT'))).toBe(true);
    expect(pool.query).toHaveBeenCalledTimes(3);
  });
  
  it('should handle errors gracefully', async () => {
    (pool.query as jest.Mock).mockRejectedValue(new Error('Query failed'));
  
    const result = await analyseRolesPermissionsAndDatabases(pool);
  
    // Here you're checking for a generic error message, so adjust as necessary
    expect(result.messages.some(m => m.text.includes('An error occurred while analysing roles, permissions, and database access'))).toBe(true);
    expect(pool.query).toHaveBeenCalled();
  });
});
