import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { databaseConfig } from './config/database.config.js';
import { THROTTLE_TTL, THROTTLE_LIMIT } from './config/constants.js';
import { AuthModule } from './auth/auth.module.js';
import { AssociationModule } from './association/association.module.js';
import { DistrictModule } from './district/district.module.js';
import { ActivityCategoryModule } from './activity-category/activity-category.module.js';
import { DailyReportModule } from './daily-report/daily-report.module.js';
import { ConsolidatedModule } from './consolidated/consolidated.module.js';
import { UnionModule } from './union/union.module.js';
import { ChurchModule } from './church/church.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
        configService.getOrThrow<TypeOrmModuleOptions>('database'),
    }),
    ThrottlerModule.forRoot([{ ttl: THROTTLE_TTL, limit: THROTTLE_LIMIT }]),
    AuthModule,
    AssociationModule,
    DistrictModule,
    ActivityCategoryModule,
    DailyReportModule,
    ConsolidatedModule,
    UnionModule,
    ChurchModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
