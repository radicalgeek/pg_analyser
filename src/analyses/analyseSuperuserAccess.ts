import { Pool } from 'pg';

export async function analyseSuperuserAccess(pool: Pool): Promise<string> {
    let result = '<h2>Superuser Access Analysis</h2>';
    const querySuperusers = `
      SELECT usename AS username
      FROM pg_catalog.pg_user
      WHERE usesuper = true;
    `;
  
    try {
      const { rows } = await pool.query(querySuperusers);
      if (rows.length > 1) { // Assuming there's always at least one legitimate superuser
        result += `Found multiple superuser accounts: ${rows.map(row => row.username).join(', ')}. Consider reviewing the necessity of each account.\n`;
      } 
    } catch (error) {
      console.error(`Error during superuser access analysis: ${error}`);
      result += `Error during superuser access analysis: ${error}` + '\n';
    }
    if (result === '<h2>Superuser Access Analysis</h2>') {
      result += 'No Issues Found.';
    }
    return result;
  }
  