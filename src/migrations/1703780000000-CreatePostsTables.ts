import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreatePostsTables1703780000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create Posts Table
        await queryRunner.createTable(
            new Table({
                name: "posts",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        isPrimary: true,
                        isNullable: false,
                    },
                    {
                        name: "userId",
                        type: "varchar",
                        isNullable: false,
                    },
                    {
                        name: "content",
                        type: "text",
                        isNullable: false,
                    },
                    {
                        name: "location",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "imageUrl",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "likesCount",
                        type: "int",
                        default: 0,
                        isNullable: false,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true,
        );

        // 2. Create Post Likes Table
        await queryRunner.createTable(
            new Table({
                name: "post_likes",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        isPrimary: true,
                        isNullable: false,
                    },
                    {
                        name: "postId",
                        type: "varchar",
                        isNullable: false,
                    },
                    {
                        name: "userId",
                        type: "varchar",
                        isNullable: false,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true,
        );

        // 3. Add Foreign Keys for Posts Table (User relation)
        // Note: Assuming the table for User entity is named 'users'
        await queryRunner.createForeignKey(
            "posts",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
            }),
        );

        // 4. Add Foreign Keys for Post Likes Table
        
        // Link to Posts
        await queryRunner.createForeignKey(
            "post_likes",
            new TableForeignKey({
                columnNames: ["postId"],
                referencedColumnNames: ["id"],
                referencedTableName: "posts",
                onDelete: "CASCADE", // If post is deleted, likes are deleted
            }),
        );

        // Link to Users
        await queryRunner.createForeignKey(
            "post_likes",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order of creation to avoid foreign key constraints
        const postLikesTable = await queryRunner.getTable("post_likes");
        const postsTable = await queryRunner.getTable("posts");

        if (postLikesTable) {
            await queryRunner.dropTable("post_likes");
        }

        if (postsTable) {
            await queryRunner.dropTable("posts");
        }
    }
}