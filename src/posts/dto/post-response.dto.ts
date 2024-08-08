import { Expose, Transform } from 'class-transformer';

export class PostResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;

  @Transform(({ obj }) => {
    return { userId: obj.user.id, username: obj.user.username };
  })
  @Expose()
  user: number;
}
