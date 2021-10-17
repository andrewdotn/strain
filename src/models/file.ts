import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class File extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  fileSlackId?: string;

  @Column()
  userSlackId?: string;

  @Column()
  messageTimestamp?: number;

  @Column()
  fileTimestamp?: number;

  @Column()
  filename?: string;

  @Column()
  filetype?: string;

  @Column()
  mimetype?: string;

  @Column()
  size?: number;

  @Column({ nullable: true })
  thumbFilename?: string;

  @Column({ nullable: true })
  originalThumbExtension?: string;

  @Column()
  originalName?: string;

  @Column()
  originalTitle?: string;
}
