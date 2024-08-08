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
    return {
      id: obj.user.id,
      name: obj.user.firstname + ' ' + obj.user.lastname,
    };
  })
  @Expose()
  user: number;
}
