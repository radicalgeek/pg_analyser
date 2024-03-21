import { Pool } from 'pg';
import { analyseRolesPermissionsAndDatabases } from '../src/analyses/analyseRolesPermissionsAndDatabases';

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

    expect(result.messages).toContain('Role: test_user');
    expect(result.messages).toContain('Accessible Databases: test_db');
    expect(result.messages).toContain('- Permissions on public.test_table (r): SELECT, INSERT');
    expect(pool.query).toHaveBeenCalledTimes(3);
  });

  it('should handle errors gracefully', async () => {
    (pool.query as jest.Mock).mockRejectedValue(new Error('Query failed'));

    const result = await analyseRolesPermissionsAndDatabases(pool);

    expect(result.messages).toContain('An error occurred while analysing roles, permissions, and database access');
    expect(pool.query).toHaveBeenCalled();
  });
});
