import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { AuthService } from '../auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { SigninUserDto } from '../dto/signin-user.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';

const mockUsersService = {
  findAll: jest.fn(),
  findOneById: jest.fn(),
};

const mockAuthService = {
  signup: jest.fn(),
  signin: jest.fn(),
};

const mockAuthGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

const mockUser = {
  id: 1,
  email: 'test.user@test.com',
  firstname: 'Testing',
  lastname: 'User',
} as User;

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });

  describe('create (signup)', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: mockUser.email,
        firstname: mockUser.firstname,
        lastname: mockUser.lastname,
        password: 'testpassword',
      };

      const token = { token: 'jwt.token' };
      jest.spyOn(authService, 'signup').mockResolvedValue(token);

      const result = await usersController.create(createUserDto);

      expect(result).toEqual(token);
      expect(authService.signup).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('signin', () => {
    it('should sign in a user', async () => {
      const signinUserDto: SigninUserDto = {
        email: 'test.user@test.com',
        password: 'testpassword',
      };

      const mockSigninResponse = { token: 'jwt.token' };
      jest.spyOn(authService, 'signin').mockResolvedValue(mockSigninResponse);

      const result = await usersController.signin(signinUserDto);

      expect(result).toEqual(mockSigninResponse);
      expect(authService.signin).toHaveBeenCalledWith(signinUserDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsersArray = [mockUser];
      jest.spyOn(usersService, 'findAll').mockResolvedValue(mockUsersArray);

      const result = await usersController.findAll();

      expect(result).toEqual(mockUsersArray);
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single user by id', async () => {
      const ID = mockUser.id;
      jest.spyOn(usersService, 'findOneById').mockResolvedValue(mockUser);

      const result = await usersController.findOne(ID);

      expect(result).toEqual(mockUser);
      expect(usersService.findOneById).toHaveBeenCalledWith(ID);
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(usersService, 'findOneById').mockResolvedValue(null);

      await expect(usersController.findOne(2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
