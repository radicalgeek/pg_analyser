import { Pool } from 'pg';

export async function analysePasswordPolicy(pool: Pool): Promise<string> {
  let result = '<h2>Password Policy and Security Modules Analysis</h2>';
  
  // Check if passwordcheck is enabled
  const queryCheckPasswordCheck = `
    SHOW shared_preload_libraries;
  `;

  try {
    const { rows } = await pool.query(queryCheckPasswordCheck);
    const loadedLibraries = rows[0]?.shared_preload_libraries;

    // Checking for passwordcheck module
    if (loadedLibraries && loadedLibraries.includes('passwordcheck')) {
      result += 'Password policy module (passwordcheck) is enabled. Ensure it is properly configured for enforcing strong passwords.\n';
    } else {
      result += 'Password policy module (passwordcheck) is not enabled. Consider enabling it for enhanced password security.\n';
    }

    // Checking for pgAudit extension
    if (loadedLibraries && loadedLibraries.includes('pgaudit')) {
      result += 'Audit logging module (pgAudit) is enabled, which can help in monitoring and analysing authentication attempts and other database activities.\n';
    } else {
      result += 'Audit logging module (pgAudit) is not enabled. Consider enabling it to improve security monitoring and compliance.\n';
    }

    // Additional Recommendations
    result += '\nAdditional Recommendations for Password Policy:\n';
    result += '- Enforce minimum password lengths of at least 12 characters.\n';
    result += '- Require a mix of uppercase letters, lowercase letters, numbers, and special characters in passwords.\n';
    result += '- Implement account lockout policies after several failed login attempts to protect against brute-force attacks.\n';
    result += '- Encourage or enforce periodic password changes, balancing this with the risk of users opting for weaker passwords.\n';
    result += '- Review and manually check the pg_hba.conf file for custom password authentication configurations, such as those using PAM (Pluggable Authentication Modules).\n';

  } catch (error) {
    console.error(`Error during password policy and security modules analysis: ${error}`);
    result += 'An error occurred while analysing password policies and security modules.\n';
  }

  return result;
}
