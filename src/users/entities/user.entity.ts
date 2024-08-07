import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  username: string;

  @Column()
  password: string;

  //   TODO after create reviews resource
  //   @OneToMany(() => Review, (review) => review.user)
  //   reviews: Review[];
}
