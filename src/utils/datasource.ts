import "reflect-metadata";
import path from "path";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    cache: {
        type: "ioredis",
        options: {
            host: "localhost",
            port: 6379
        }
    },
    entities: [
        path.resolve(process.cwd(), "database/entities/*.js")
    ],
    migrations: ["dist/migrations/*.js"],
    synchronize: true
});
