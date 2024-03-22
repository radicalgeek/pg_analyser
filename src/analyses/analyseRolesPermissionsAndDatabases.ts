import { Pool } from 'pg';
import { AnalysisResult, MessageType } from '../types/analysisResult';

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

      let roleMessage = `
      Role: ${role.rolname}\n
      Attributes: Superuser: ${role.rolsuper}, Can Login: ${role.rolcanlogin}\n
      Accessible Databases: ${accessibleDbs || 'None'}
      `.trim();
      
      if (permissionsRes.rows.length > 0) {
        let permissionsText = permissionsRes.rows.map(({ schema, object, type, privileges }) => {
          const privilegesArray = privileges.replace('{', '').replace('}', '').split(',');
          return `- Permissions on ${schema}.${object} (${type}): ${privilegesArray.join(', ')}`;
        }).join('\n');
      
        roleMessage += `\n${permissionsText}`;
      } else {
        roleMessage += '\nNo explicit permissions or inherited permissions on database objects.';
      }
      
      result.messages.push({
        text: roleMessage,
        type: MessageType.Warning 
      });


    }
  } catch (error) {
    console.error(`Error during roles, permissions, and database access analysis: ${error}`);
    result.messages.push({text:'An error occurred while analysing roles, permissions, and database access', type: MessageType.Error});
  }

  return result;
}
