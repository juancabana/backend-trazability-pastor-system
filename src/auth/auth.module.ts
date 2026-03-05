import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './domain/entities/user.entity.js';
import { UserRepository } from './infrastructure/repositories/user.repository.js';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy.js';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { GetUsersUseCase } from './application/use-cases/get-users.use-case.js';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case.js';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case.js';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case.js';
import { RolesGuard } from './guards/roles.guard.js';
import { AuthController } from './presentation/auth.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'pastor_jwt_secret_2026',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    UserRepository,
    JwtStrategy,
    LoginUseCase,
    GetUsersUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    RolesGuard,
  ],
  exports: [JwtModule, RolesGuard, UserRepository],
})
export class AuthModule {}
