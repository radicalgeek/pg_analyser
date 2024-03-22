import { Pool } from 'pg';
import { AnalysisResult, MessageType } from '../types/analysisResult';

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
        result.messages.push({text:`Found multiple superuser accounts: ${rows.map(row => row.username).join(', ')}. Consider reviewing the necessity of each account.`, type: MessageType.Warning});
      } 
    } catch (error) {
      console.error(`Error during superuser access analysis: ${error}`);
      result.messages.push({text:`Error during superuser access analysis: ${error}`, type: MessageType.Error});
    }
    if (result.messages.length === 0) {
      result.messages.push({text:'No issues found.', type: MessageType.Info});
    }
    return result;
  }
  