require('dotenv').config();
import { connectDatabase } from './database';
import { logger } from './logger';
import { server } from './socket';

const port = process.env.PORT || 5000;

server.listen(port, () => {
  connectDatabase();
  logger.debug(`Listening: http://localhost:${port}`);
});
