import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class GuildConfig {
    @PrimaryColumn()
    guild_id: string;

    @Column("varchar", { array: true, default: [] })
    allowed_channels: string[];

    @Column("decimal", { default: 0.2 })
    chance: number;

    @Column({ default: 300 })
    interval: number;

    @Column({ nullable: true })
    role_id: string;

    @Column({ default: 60 })
    timeout: number;
}
