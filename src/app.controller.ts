import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';
import {
  BUSINESS_TIMEZONE,
  COMPLIANCE_THRESHOLD,
  COMPLIANCE_AMBER_THRESHOLD,
  DEFAULT_REPORT_DEADLINE_DAY,
  MAX_REPORT_DEADLINE_DAY,
  MIN_REPORT_DEADLINE_DAY,
  YEAR_MIN,
  YEAR_MAX,
} from './config/constants.js';

export interface PublicConfigResponse {
  timezone: string;
  compliance: {
    threshold: number;
    amberThreshold: number;
  };
  reportDeadlineDay: {
    default: number;
    min: number;
    max: number;
  };
  yearRange: {
    min: number;
    max: number;
  };
}

@ApiTags('config')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth(): object {
    return this.appService.getHealth();
  }

  /**
   * Configuracion publica de reglas de negocio para el cliente.
   * No requiere autenticacion: son valores no sensibles que el frontend
   * necesita para evitar duplicar logica de negocio.
   */
  @Get('config/public')
  getPublicConfig(): PublicConfigResponse {
    return {
      timezone: BUSINESS_TIMEZONE,
      compliance: {
        threshold: COMPLIANCE_THRESHOLD,
        amberThreshold: COMPLIANCE_AMBER_THRESHOLD,
      },
      reportDeadlineDay: {
        default: DEFAULT_REPORT_DEADLINE_DAY,
        min: MIN_REPORT_DEADLINE_DAY,
        max: MAX_REPORT_DEADLINE_DAY,
      },
      yearRange: {
        min: YEAR_MIN,
        max: YEAR_MAX,
      },
    };
  }
}
