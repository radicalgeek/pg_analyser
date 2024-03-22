import { Pool } from 'pg';
import { AnalysisResult, MessageType } from '../types/analysisResult';

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
        result.messages.push({text:'The pgcrypto extension is installed, suggesting some level of column-level encryption may be in use.', type: MessageType.Info});
      } else {
        result.messages.push({text:'The pgcrypto extension is not installed. Consider using pgcrypto for column-level encryption or ensure filesystem-level encryption is enabled.', type: MessageType.Warning});
      }
    } catch (error) {
      console.error(`Error during data-at-rest encryption analysis: ${error}`);
      result.messages.push({text:`An error occurred while analysing data-at-rest encryption:`, type: MessageType.Error});
    }
  
    return result;
}
