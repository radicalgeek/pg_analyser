import { Pool } from 'pg';
import { AnalysisResult } from '../types/analysisResult';

export async function analyseDataAtRestEncryption(pool: Pool): Promise<AnalysisResult> {
    let result: AnalysisResult = {
      title: `Data-at-Rest Encryption Analysis`,
      messages: []
    };
  
    // Check for installation of the pgcrypto extension
    const queryPgcryptoInstalled = `
      SELECT extname
      FROM pg_extension
      WHERE extname = 'pgcrypto';
    `;
  
    try {
      const { rows } = await pool.query(queryPgcryptoInstalled);
      if (rows.length > 0) {
        result.messages.push('The pgcrypto extension is installed, suggesting some level of column-level encryption may be in use.');
      } else {
        result.messages.push('The pgcrypto extension is not installed. Consider using pgcrypto for column-level encryption or ensure filesystem-level encryption is enabled.');
      }
    } catch (error) {
      console.error(`Error during data-at-rest encryption analysis: ${error}`);
      result.messages.push(`An error occurred while analysing data-at-rest encryption:`);
    }
  
    return result;
}
