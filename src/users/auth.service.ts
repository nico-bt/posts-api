import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { SigninUserDto } from './dto/signin-user.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async signup(createUserDto: CreateUserDto) {
    const user = await this.usersService.findOneByEmail(createUserDto.email);

    if (user) {
      throw new BadRequestException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    createUserDto.password = hashedPassword;

    const newUser = await this.usersService.create(createUserDto);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
    );

    return { token };
  }

  async signin(siginUserDto: SigninUserDto) {
    const user = await this.usersService.findOneByEmail(siginUserDto.email);

    if (!user) {
      throw new BadRequestException('Email NOT registered');
    }

    const passwordMatch = await bcrypt.compare(
      siginUserDto.password,
      user.password,
    );

    if (!passwordMatch) {
      throw new BadRequestException('Wrong password');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
    );

    return { token };
  }
}
