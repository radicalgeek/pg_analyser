import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import bodyParser from 'body-parser';
import { getPool, setupDatabase } from './utils/dbClient';
import { Pool } from 'pg';
import { Request, Response, NextFunction } from 'express';
import { groupResultsByTitle, mergeResultsWithSameTitle, formatResultsForWeb } from './utils/formatResults';
import { runAllAnalyses } from './analysesRunner';
import { CliArgs } from './types/cliArgs';


export function startServer(cliArgs: CliArgs) {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const port = 3000; 
  setupDatabase();
  const pool: Pool = getPool();

  app.use(bodyParser.json());
  app.use(express.static('src/public')); 

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('startAnalysis', async () => {
      pool.connect(async (err, client, release) => {
        if (err) {
          socket.emit('error', '<pre>Database connection error. Please check your configuration.</pre>');
          console.error('Error acquiring database client', err.stack);
          return; 
        }
        try {
          const analysisResults = await runAllAnalyses(pool);
          const groupedResults = groupResultsByTitle(analysisResults);
          const mergedResults = mergeResultsWithSameTitle(groupedResults);
          socket.emit('analysisComplete', formatResultsForWeb(mergedResults));
        } catch (error) {
          socket.emit('error', `<pre>Error: ${error}</pre>`);
        }
      });
    });
  });

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  httpServer.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}


