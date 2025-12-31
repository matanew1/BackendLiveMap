// src/posts/post.entity.ts
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { PostLike } from './post-like.entity';

@Entity('posts')
export class Post {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('text')
  content: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: string;

  @Column('varchar', { nullable: true })
  imageUrl: string;

  @Column('int', { default: 0 })
  likesCount: number;

  @OneToMany(() => PostLike, (like) => like.post)
  likes: PostLike[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
