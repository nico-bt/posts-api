import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from './auth.service';
import { SigninUserDto } from './dto/signin-user.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthGuard } from './guards/auth.guard';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('signup')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.signup(createUserDto);
  }

  @HttpCode(200)
  @Post('signin')
  signin(@Body() signinUserDto: SigninUserDto) {
    return this.authService.signin(signinUserDto);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  userInfo(@CurrentUser() user: any) {
    return user;
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOneById(id);
  }
}
