import { Pool } from 'pg';
import { AnalysisResult, MessageType } from '../types/analysisResult';

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
        result.messages.push({text:'SSL is enabled, suggesting data-in-transit is encrypted.', type: MessageType.Info});
      } else {
        result.messages.push({text:'SSL is not enabled. Consider enabling SSL to encrypt data-in-transit.', type: MessageType.Warning});
      }
    } catch (error) {
      console.error(`Error during data-in-transit encryption analysis: ${error}`);
      result.messages.push({text:'An error occurred while analysing data-in-transit encryption.', type: MessageType.Error});
    }
  
    return result;
  };
  