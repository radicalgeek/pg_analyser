import { Pool } from 'pg';

export async function analyseDataInTransitEncryption(pool: Pool): Promise<string> {
    let result = '<h2>Data-in-Transit Encryption Analysis</h2>';
  
    // Check if SSL is enabled in the PostgreSQL server
    const querySSLEnabled = `
      SHOW ssl;
    `;
  
    try {
      const { rows } = await pool.query(querySSLEnabled);
      if (rows[0] && rows[0].ssl === 'on') {
        result += 'SSL is enabled, suggesting data-in-transit is encrypted.\n';
      } else {
        result += 'SSL is not enabled. Consider enabling SSL to encrypt data-in-transit.\n';
      }
    } catch (error) {
      console.error(`Error during data-in-transit encryption analysis: ${error}`);
      result += 'An error occurred while analysing data-in-transit encryption.\n';
    }
  
    return result;
  };
  