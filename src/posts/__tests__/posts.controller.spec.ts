import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/users/entities/user.entity';
import { Post } from '../entities/post.entity';
import { PostsController } from '../posts.controller';
import { PostsService } from '../posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { AuthGuard } from 'src/guards/auth.guard';

const mockUser = {
  id: 1,
  email: 'test@example.com',
  firstname: 'Testing',
  lastname: 'User',
} as User;

const mockPost = {
  id: 1,
  title: 'Test Post',
  content: 'This is a test post',
  user: mockUser,
} as Post;

describe('PostsController', () => {
  let postsController: PostsController;
  let postsService: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    postsController = module.get<PostsController>(PostsController);
    postsService = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(postsController).toBeDefined();
  });

  describe('create', () => {
    it('should create a new post', async () => {
      const createPostDto: CreatePostDto = {
        title: 'New Post',
        content: 'This is a new post',
      };
      jest.spyOn(postsService, 'create').mockResolvedValue(mockPost);

      const result = await postsController.create(createPostDto, mockUser);

      expect(result).toEqual(mockPost);
      expect(postsService.create).toHaveBeenCalledWith(createPostDto, mockUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of posts', async () => {
      jest.spyOn(postsService, 'findAll').mockResolvedValue([mockPost]);

      const result = await postsController.findAll();

      expect(result).toEqual([mockPost]);
      expect(postsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single post by id', async () => {
      const ID = mockPost.id;
      jest.spyOn(postsService, 'findOne').mockResolvedValue(mockPost);

      const result = await postsController.findOne(ID);

      expect(result).toEqual(mockPost);
      expect(postsService.findOne).toHaveBeenCalledWith(ID);
    });
  });

  describe('update', () => {
    it('should update a post by id', async () => {
      const updatePostDto: UpdatePostDto = { title: 'Updated Post' };
      const updatedPost = { ...mockPost, ...updatePostDto };

      jest.spyOn(postsService, 'update').mockResolvedValue(updatedPost);

      const result = await postsController.update(
        mockPost.id,
        updatePostDto,
        mockUser,
      );

      expect(result).toEqual(updatedPost);
      expect(postsService.update).toHaveBeenCalledWith(
        mockPost.id,
        updatePostDto,
        mockUser,
      );
    });
  });

  describe('remove', () => {
    it('should remove a post by id', async () => {
      jest.spyOn(postsService, 'remove').mockResolvedValue(mockPost);

      const result = await postsController.remove(mockPost.id, mockUser);

      expect(result).toEqual(mockPost);
      expect(postsService.remove).toHaveBeenCalledWith(mockPost.id, mockUser);
    });
  });
});
