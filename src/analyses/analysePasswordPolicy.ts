import { Pool } from 'pg';
import { AnalysisResult } from '../types/analysisResult';

export async function analysePasswordPolicy(pool: Pool): Promise<AnalysisResult> {
  let result: AnalysisResult = {
    title: `Password Policy and Security Modules Analysis`,
    messages: []
  };

  // Check if passwordcheck is enabled
  const queryCheckPasswordCheck = `
    SHOW shared_preload_libraries;
  `;

  try {
    const { rows } = await pool.query(queryCheckPasswordCheck);
    const loadedLibraries = rows[0]?.shared_preload_libraries;

    // Checking for passwordcheck module
    if (loadedLibraries && loadedLibraries.includes('passwordcheck')) {
      result.messages.push('Password policy module (passwordcheck) is enabled. Ensure it is properly configured for enforcing strong passwords.');
    } else {
      result.messages.push('Password policy module (passwordcheck) is not enabled. Consider enabling it for enhanced password security.');
    }

    // Checking for pgAudit extension
    if (loadedLibraries && loadedLibraries.includes('pgaudit')) {
      result.messages.push('Audit logging module (pgAudit) is enabled, which can help in monitoring and analysing authentication attempts and other database activities.');
    } else {
      result.messages.push('Audit logging module (pgAudit) is not enabled. Consider enabling it to improve security monitoring and compliance.');
    }

    // Additional Recommendations
    result.messages.push('Additional Recommendations for Password Policy:');
    result.messages.push('- Enforce minimum password lengths of at least 12 characters.');
    result.messages.push('- Require a mix of uppercase letters, lowercase letters, numbers, and special characters in passwords.');
    result.messages.push('- Implement account lockout policies after several failed login attempts to protect against brute-force attacks.');
    result.messages.push('- Encourage or enforce periodic password changes, balancing this with the risk of users opting for weaker passwords.');
    result.messages.push('- Review and manually check the pg_hba.conf file for custom password authentication configurations, such as those using PAM (Pluggable Authentication Modules).');

  } catch (error) {
    console.error(`Error during password policy and security modules analysis: ${error}`);
    result.messages.push('An error occurred while analysing password policies and security modules.');
  }

  return result;
}
