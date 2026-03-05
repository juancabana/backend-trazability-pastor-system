import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): object {
    return {
      status: 'ok',
      service: 'Pastor Activity Tracking API',
      timestamp: new Date().toISOString(),
    };
  }
}
