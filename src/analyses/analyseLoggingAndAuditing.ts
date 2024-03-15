import { Pool } from 'pg';

export async function analyseLoggingAndAuditing(pool: Pool): Promise<string> {
  let result = '<h2>Logging and Auditing Analysis</h2>';

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
        result += `${setting}: ${rows[0].setting}\n`;
      } else {
        result += `${setting}: Not found\n`;
      }
    }
  } catch (error) {
    console.error(`Error during logging and auditing analysis: ${error}`);
    result += 'An error occurred while analysing logging and auditing settings.\n';
  }

  return result;
}
