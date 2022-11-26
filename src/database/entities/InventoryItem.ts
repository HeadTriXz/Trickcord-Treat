import { CreateDateColumn, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class InventoryItem {
    @PrimaryColumn()
    guild_id: string;

    @PrimaryColumn()
    user_id: string;

    @PrimaryColumn()
    item_id: number;

    @CreateDateColumn()
    created_at: Date;
}
