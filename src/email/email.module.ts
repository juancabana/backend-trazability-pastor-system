import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service.js';
import { ExcelGeneratorService } from './excel-generator.service.js';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, ExcelGeneratorService],
  exports: [EmailService, ExcelGeneratorService],
})
export class EmailModule {}
