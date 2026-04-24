import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JWT_EXPIRY } from '../config/constants.js';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './domain/entities/user.entity.js';
import { AssociationEntity } from '../association/domain/entities/association.entity.js';
import { UnionEntity } from '../union/domain/entities/union.entity.js';
import { UserRepository } from './infrastructure/repositories/user.repository.js';
import { AssociationRepository } from '../association/infrastructure/repositories/association.repository.js';
import { UnionRepository } from '../union/infrastructure/repositories/union.repository.js';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { GetUsersUseCase } from './application/use-cases/get-users.use-case.js';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case.js';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case.js';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case.js';
import { ChangeOwnPasswordUseCase } from './application/use-cases/change-own-password.use-case.js';
import { RolesGuard } from './guards/roles.guard.js';
import { AuthController } from './presentation/auth.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, AssociationEntity, UnionEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is not set');
        }
        return {
          secret,
          signOptions: { expiresIn: JWT_EXPIRY },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    UserRepository,
    AssociationRepository,
    UnionRepository,
    JwtStrategy,
    LoginUseCase,
    GetUsersUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    ChangeOwnPasswordUseCase,
    RolesGuard,
  ],
  exports: [JwtModule, RolesGuard, UserRepository],
})
export class AuthModule {}
