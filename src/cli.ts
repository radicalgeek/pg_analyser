const { runAllAnalyses } = require('./analysesRunner'); 
const { getPool, setupDatabase } = require('./utils/dbClient');
const { CliArgs } = require('./types/cliArgs');

export function runCliAnalysis(cliArgs: typeof CliArgs) {
  const dbConfig = {
    host: cliArgs.dbHost,
    user: cliArgs.dbUser,
    password: cliArgs.dbPassword,
    database: cliArgs.dbName,
    port: cliArgs.dbPort,
  };

  setupDatabase(dbConfig);
  const pool = getPool();

  // Run analyses and output results to CLI...
};