import { Pool } from 'pg';
import { AnalysisResult } from '../types/analysisResult';

export async function analyseRolesPermissionsAndDatabases(pool: Pool): Promise<AnalysisResult> {
  let result: AnalysisResult = {
    title: `Roles, Permissions, and Database Access Analysis`,
    messages: []
  };

  const queryRoles = `
    SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin, oid
    FROM pg_roles
    WHERE rolname NOT IN ('postgres', 'your_system_role')
    AND rolname NOT LIKE 'pg_%';;
  `;

  const queryDatabases = `
    SELECT datname
    FROM pg_database
    WHERE has_database_privilege($1, datname, 'CONNECT');
  `;

  const queryPermissions = `
    WITH granted_roles AS (
      SELECT oid, rolname FROM pg_roles WHERE pg_has_role($1, oid, 'member')
    )
    SELECT nspname AS schema, relname AS object, relkind AS type, array_agg(privilege_type) AS privileges
    FROM information_schema.role_table_grants rtg
    JOIN pg_class ON rtg.table_name = relname
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    JOIN granted_roles ON rtg.grantee = granted_roles.rolname
    WHERE pg_namespace.nspname NOT IN ('pg_catalog', 'information_schema')
    GROUP BY schema, object, type
    UNION
    SELECT nspname AS schema, proname AS object, 'function' AS type, array_agg(privilege_type) AS privileges
    FROM information_schema.role_routine_grants rrg
    JOIN pg_proc ON rrg.specific_name = proname
    JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
    JOIN granted_roles ON rrg.grantee = granted_roles.rolname
    WHERE pg_namespace.nspname NOT IN ('pg_catalog', 'information_schema')
    GROUP BY schema, object, type;
  `;

  try {
    const rolesRes = await pool.query(queryRoles);
    for (const role of rolesRes.rows) {
      const dbRes = await pool.query(queryDatabases, [role.rolname]);
      const permissionsRes = await pool.query(queryPermissions, [role.rolname]);
      const accessibleDbs = dbRes.rows.map(row => row.datname).join(', ');

      result.messages.push(`Role: ${role.rolname}`);
      result.messages.push(`Attributes: Superuser: ${role.rolsuper}, Can Login: ${role.rolcanlogin}`);
      result.messages.push(`Accessible Databases: ${accessibleDbs || 'None'}`);

      if (permissionsRes.rows.length > 0) {
        permissionsRes.rows.forEach(({ schema, object, type, privileges }) => {
          const privilegesArray = privileges.replace('{', '').replace('}', '').split(',');
          result.messages.push(`- Permissions on ${schema}.${object} (${type}): ${privilegesArray.join(', ')}`);
        });
      } else {
        result.messages.push('No explicit permissions or inherited permissions on database objects.');
      }


    }
  } catch (error) {
    console.error(`Error during roles, permissions, and database access analysis: ${error}`);
    result.messages.push('An error occurred while analysing roles, permissions, and database access');
  }

  return result;
}
