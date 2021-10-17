import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Emoji extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  name?: string;

  @Column()
  url?: string;

  /**
   * Where the file is stored locally
   */
  @Column({nullable: true})
  localpath?: string;
}
