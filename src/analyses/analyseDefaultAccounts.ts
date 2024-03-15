import { Pool } from 'pg';

export async function analyseDefaultAccounts(pool: Pool): Promise<string> {
    let result = '<h2>Default Account Review</h2>';
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
            result += `Found common usernames that may have weak/default passwords: ${foundUsernames}. Please review these accounts.\n`;
        } else {
            result += 'No common default usernames found.\n';
        }
    } catch (error) {
        console.error(`Error during default account review: ${error}`);
        result += 'An error occurred while reviewing default accounts.\n';
    }

    return result;
}
