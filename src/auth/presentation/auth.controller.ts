import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from '../decorators/roles.decorator.js';
import { Throttle } from '@nestjs/throttler';
import {
  THROTTLE_LOGIN_TTL,
  THROTTLE_LOGIN_LIMIT,
} from '../../config/constants.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import type { JwtPayload } from '../infrastructure/strategies/jwt.strategy.js';
import { LoginUseCase } from '../application/use-cases/login.use-case.js';
import { GetUsersUseCase } from '../application/use-cases/get-users.use-case.js';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case.js';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case.js';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case.js';
import { ChangeOwnPasswordUseCase } from '../application/use-cases/change-own-password.use-case.js';
import { LoginDto } from '../application/dtos/login.dto.js';
import { AuthTokenResponseDto } from '../application/dtos/auth-token.response.dto.js';
import { CreateUserDto } from '../application/dtos/create-user.dto.js';
import { UpdateUserDto } from '../application/dtos/update-user.dto.js';
import { UserResponseDto } from '../application/dtos/user.response.dto.js';
import { ChangeOwnPasswordDto } from '../application/dtos/change-own-password.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly changeOwnPasswordUseCase: ChangeOwnPasswordUseCase,
  ) {}

  @Post('login')
  @Throttle({
    default: { ttl: THROTTLE_LOGIN_TTL, limit: THROTTLE_LOGIN_LIMIT },
  })
  @ApiOperation({ summary: 'Autenticacion de usuario' })
  @ApiResponse({ status: 200, type: AuthTokenResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciales invalidas' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos' })
  login(@Body() dto: LoginDto): Promise<AuthTokenResponseDto> {
    return this.loginUseCase.execute(dto);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cambiar contraseña propia (primer ingreso o voluntario)',
  })
  @ApiResponse({ status: 204, description: 'Contraseña actualizada' })
  @ApiResponse({ status: 400, description: 'Contraseña muy corta' })
  async changeOwnPassword(
    @Request() req: { user: JwtPayload },
    @Body() dto: ChangeOwnPasswordDto,
  ): Promise<void> {
    return this.changeOwnPasswordUseCase.execute(req.user.sub, dto.newPassword);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN_READONLY)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar usuarios (filtrable por asociacion, paginable)',
  })
  @ApiQuery({ name: 'associationId', required: false })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Pagina (desde 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Registros por pagina',
  })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  getUsers(
    @Request() req: { user: JwtPayload },
    @Query('associationId') associationId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page) : undefined;
    const l = limit ? parseInt(limit) : undefined;
    return this.getUsersUseCase.execute(
      associationId ?? req.user.associationId ?? undefined,
      p && p > 0 ? p : undefined,
      l && l > 0 ? l : undefined,
    );
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear usuario (admin)' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.createUserUseCase.execute(dto);
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar usuario (admin)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  updateUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.updateUserUseCase.execute(id, dto);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar usuario (admin)' })
  @ApiResponse({ status: 200 })
  deleteUser(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.deleteUserUseCase.execute(id);
  }
}
