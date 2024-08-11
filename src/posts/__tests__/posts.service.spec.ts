import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreatePostDto } from '../dto/create-post.dto';
import { Post } from '../entities/post.entity';
import { PostsService } from '../posts.service';
import { User } from '../../users/entities/user.entity';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UpdatePostDto } from '../dto/update-post.dto';

const createPostDto: CreatePostDto = {
  title: 'Test Post',
  content: 'This is a test post',
};

const mockUser = {
  id: 1,
  firstname: 'Test',
  lastname: 'User',
  email: 'test.user@test.com',
} as User;

const mockPost = {
  id: 1,
  title: 'Test Post',
  content: 'This is a test post',
  user: mockUser,
} as Post;

const mockPostsRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('PostsService', () => {
  let postsService: PostsService;
  let postsRepository: Repository<Post>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useFactory: mockPostsRepository,
        },
      ],
    }).compile();

    postsService = module.get<PostsService>(PostsService);
    postsRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
  });

  it('should be defined', () => {
    expect(postsService).toBeDefined();
  });

  describe('Create', () => {
    it('should create a new post with the passed data calling postsRepository', async () => {
      jest.spyOn(postsRepository, 'create').mockReturnValue(mockPost);
      jest.spyOn(postsRepository, 'save').mockResolvedValue(mockPost);

      const result = await postsService.create(createPostDto, mockUser);
      expect(result).toEqual(mockPost);

      expect(postsRepository.create).toHaveBeenCalledWith(createPostDto);
      expect(postsRepository.save).toHaveBeenCalledWith(mockPost);
    });
  });

  describe('findAll', () => {
    it('should return an array of posts', async () => {
      const mockedPosts = [mockPost];

      jest.spyOn(postsRepository, 'find').mockResolvedValue(mockedPosts);

      expect(await postsService.findAll()).toEqual(mockedPosts);
      expect(postsRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single post by id', async () => {
      jest.spyOn(postsRepository, 'findOne').mockResolvedValue(mockPost);

      const result = await postsService.findOne(mockPost.id);

      expect(result).toEqual(mockPost);
      expect(postsRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPost.id },
        relations: { user: true },
      });
    });

    it('should throw a NotFoundException if post is not found', async () => {
      const ID = 9999;
      jest.spyOn(postsRepository, 'findOne').mockResolvedValue(null);

      await expect(postsService.findOne(ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updatePostDto: UpdatePostDto = {
      title: 'Updated Post',
      content: 'This is an updated post description',
    };
    const mockUpdatedPost = { ...mockPost, ...updatePostDto };

    it('should update a post by id if the user is the owner', async () => {
      jest.spyOn(postsRepository, 'findOne').mockResolvedValue(mockPost);
      jest.spyOn(postsRepository, 'save').mockResolvedValue(mockUpdatedPost);

      const result = await postsService.update(
        mockPost.id,
        updatePostDto,
        mockUser,
      );

      expect(result).toEqual(mockUpdatedPost);

      expect(postsRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPost.id },
        relations: { user: true },
      });
      expect(postsRepository.save).toHaveBeenCalledWith(mockUpdatedPost);
    });

    it('should throw an UnauthorizedException if the user is not the owner', async () => {
      const anotherUser = { id: 2 } as User;

      jest.spyOn(postsRepository, 'findOne').mockResolvedValue(mockPost);

      await expect(
        postsService.update(mockPost.id, updatePostDto, anotherUser),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('remove', () => {
    it('should remove a post if the user is the owner', async () => {
      jest.spyOn(postsRepository, 'findOne').mockResolvedValue(mockPost);
      jest.spyOn(postsRepository, 'remove').mockResolvedValue(mockPost);

      const result = await postsService.remove(mockPost.id, mockUser);

      expect(result).toEqual(mockPost);

      expect(postsRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPost.id },
        relations: { user: true },
      });
      expect(postsRepository.remove).toHaveBeenCalledWith(mockPost);
    });

    it('should throw an UnauthorizedException if the user is not the owner', async () => {
      const anotherUser = { id: 2 } as User;

      jest.spyOn(postsRepository, 'findOne').mockResolvedValue(mockPost);

      await expect(
        postsService.remove(mockPost.id, anotherUser),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
