import { EventSubscriber, Connection } from 'typeorm';

@EventSubscriber()
export class DatabaseSubscriber {
  async afterConnect(connection: Connection): Promise<void> {
    await connection.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  }
}
