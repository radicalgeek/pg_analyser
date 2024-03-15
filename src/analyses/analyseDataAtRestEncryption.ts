import { Pool } from 'pg';

export async function analyseDataAtRestEncryption(pool: Pool): Promise<string> {
    let result = '<h2>Data-at-Rest Encryption Analysis</h2>';
  
    // Check for installation of the pgcrypto extension
    const queryPgcryptoInstalled = `
      SELECT extname
      FROM pg_extension
      WHERE extname = 'pgcrypto';
    `;
  
    try {
      const { rows } = await pool.query(queryPgcryptoInstalled);
      if (rows.length > 0) {
        result += 'The pgcrypto extension is installed, suggesting some level of column-level encryption may be in use.\n';
      } else {
        result += 'The pgcrypto extension is not installed. Consider using pgcrypto for column-level encryption or ensure filesystem-level encryption is enabled.\n';
      }
    } catch (error) {
      console.error(`Error during data-at-rest encryption analysis: ${error}`);
      result += `An error occurred while analysing data-at-rest encryption:.` + '\n';
    }
  
    return result;
}
