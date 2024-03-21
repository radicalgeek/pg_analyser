import { Pool } from 'pg';
import { AnalysisResult } from '../types/analysisResult';

export async function analyseDataInTransitEncryption(pool: Pool): Promise<AnalysisResult> {
    let result: AnalysisResult = {
      title: `Data-in-Transit Encryption Analysis`,
      messages: []
    };
    // Check if SSL is enabled in the PostgreSQL server
    const querySSLEnabled = `
      SHOW ssl;
    `;
  
    try {
      const { rows } = await pool.query(querySSLEnabled);
      if (rows[0] && rows[0].ssl === 'on') {
        result.messages.push('SSL is enabled, suggesting data-in-transit is encrypted.');
      } else {
        result.messages.push('SSL is not enabled. Consider enabling SSL to encrypt data-in-transit.');
      }
    } catch (error) {
      console.error(`Error during data-in-transit encryption analysis: ${error}`);
      result.messages.push('An error occurred while analysing data-in-transit encryption.');
    }
  
    return result;
  };
  