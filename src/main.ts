const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const startServer = require('./src/web'); // Assume this starts your express server
const runCliAnalysis = require('./src/cli'); // Assume this handles CLI analysis logic

const { argv } = yargs(hideBin(process.argv))
  .option('server', {
    alias: 's',
    type: 'boolean',
    description: 'Run in server mode',
  })
  .option('dbHost', {
    alias: 'h',
    type: 'string',
    description: 'Database host',
  })
  .option('dbUser', {
    alias: 'u',
    type: 'string',
    description: 'Database user',
  })
  .option('dbPassword', {
    alias: 'p',
    type: 'string',
    description: 'Database password',
  })
  .option('dbName', {
    alias: 'n',
    type: 'string',
    description: 'Database name',
  })
  .option('dbPort', {
    alias: 'P',
    type: 'number',
    description: 'Database port',
  });

const { server, ...cliOptions } = argv;
const cliArgs: typeof CliArgs = cliOptions;

if (server) {
  // Server mode
  startServer(cliArgs);
} else {
  // CLI mode
  runCliAnalysis(cliArgs);
}