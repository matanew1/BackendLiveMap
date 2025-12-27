// src/auth/user.entity.ts
import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryColumn('varchar')
  id: string; // Supabase user ID

  @Column({ unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  // Dog-related fields
  @Column({ nullable: true })
  dogName: string;

  @Column({ nullable: true })
  dogBreed: string;

  @Column({ nullable: true })
  dogAge: number;

  @Column({ nullable: true })
  avatarUrl: string | null;

  @CreateDateColumn()
  created_at: Date;
}
