import { Pool } from 'pg';
import { AnalysisResult } from '../types/analysisResult';

export async function analyseSuperuserAccess(pool: Pool): Promise<AnalysisResult> {
    let result: AnalysisResult = {
      title: `Superuser Access Analysis`,
      messages: []
    };

    const querySuperusers = `
      SELECT usename AS username
      FROM pg_catalog.pg_user
      WHERE usesuper = true;
    `;
  
    try {
      const { rows } = await pool.query(querySuperusers);
      if (rows.length > 1) { // Assuming there's always at least one legitimate superuser
        result.messages.push(`Found multiple superuser accounts: ${rows.map(row => row.username).join(', ')}. Consider reviewing the necessity of each account.`);
      } 
    } catch (error) {
      console.error(`Error during superuser access analysis: ${error}`);
      result.messages.push(`Error during superuser access analysis: ${error}`);
    }
    if (result.messages.length === 0) {
      result.messages.push('No Issues Found.');
    }
    return result;
  }
  