import { Pool } from 'pg';
import { AnalysisResult } from '../types/analysisResult';

export async function analyseDefaultAccounts(pool: Pool): Promise<AnalysisResult> {
    let result: AnalysisResult = {
        title: `Default Account Review`,
        messages: []
      };
    const commonUsernames = ['postgres', 'pg', 'admin', 'user']; // Extend this list based on common or expected default usernames

    const queryAccounts = `
        SELECT usename AS username
        FROM pg_catalog.pg_user
        WHERE usename = ANY($1::text[]);
    `;

    try {
        const { rows } = await pool.query(queryAccounts, [commonUsernames]);
        if (rows.length > 0) {
            const foundUsernames = rows.map(row => row.username).join(', ');
            result.messages.push(`Found common usernames that may have weak/default passwords: ${foundUsernames}. Please review these accounts.`);
        } else {
            result.messages.push('No common default usernames found.');
        }
    } catch (error) {
        console.error(`Error during default account review: ${error}`);
        result.messages.push('An error occurred while reviewing default accounts.');
    }

    return result;
}
