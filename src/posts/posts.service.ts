import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post) private readonly postsRepository: Repository<Post>,
  ) {}

  create(createPostDto: CreatePostDto, user: User) {
    const post = this.postsRepository.create(createPostDto);
    post.user = user;

    return this.postsRepository.save(post);
  }

  findAll() {
    return this.postsRepository.find({ relations: { user: true } });
  }

  async findOne(id: number) {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!post) {
      throw new NotFoundException('No post with id : ' + id);
    }
    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto, user: User) {
    const post = await this.findOne(id);

    if (post.user.id !== user.id) {
      throw new UnauthorizedException("Ey! You can't edit other people posts");
    }

    Object.assign(post, updatePostDto);

    return this.postsRepository.save(post);
  }

  async remove(id: number, user: User) {
    const post = await this.findOne(id);

    if (post.user.id !== user.id) {
      throw new UnauthorizedException(
        "Ey! You can't delete other people posts",
      );
    }

    return this.postsRepository.remove(post);
  }
}
