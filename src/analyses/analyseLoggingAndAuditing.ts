import { Pool } from 'pg';
import { AnalysisResult, MessageType } from '../types/analysisResult';

export async function analyseLoggingAndAuditing(pool: Pool): Promise<AnalysisResult> {
  let result: AnalysisResult = {
    title: `Logging and Auditing Analysis`,
    messages: []
  };

  const loggingSettings = [
    'log_connections',
    'log_disconnections',
    'log_authentication_attempts',
    'log_statement',
    'log_min_duration_statement',
    'log_lock_waits',
    'log_checkpoints',
    'log_error_verbosity',
    'log_min_error_statement',
    'log_min_messages',
    'log_autovacuum_min_duration',
    'log_runtime_parameters',
    'log_replication_commands',
    'log_recovery_conflicts_waits',
    'log_session',
    'log_transaction_sample_rate',
  ];

  try {
    for (const setting of loggingSettings) {
      const query = `SELECT name, setting FROM pg_settings WHERE name = $1;`;
      const { rows } = await pool.query(query, [setting]);
      if (rows.length > 0) {
        result.messages.push({text:`${setting}: ${rows[0].setting}`, type: MessageType.Info});
      } else {
        result.messages.push({text:`${setting}: Not found`, type: MessageType.Warning});
      }
    }
  } catch (error) {
    console.error(`Error during logging and auditing analysis: ${error}`);
    result.messages.push({text:'An error occurred while analysing logging and auditing settings.', type: MessageType.Error});
  }

  return result;
}
