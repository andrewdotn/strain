import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
@Index(["channelSlackId", "threadTimestamp"])
export class Message extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  channelSlackId?: string;

  @Column()
  messageTimestamp?: number;

  /** This is also a unique ID for the thread */
  @Column()
  threadTimestamp?: number;

  @Column()
  isReply?: boolean;

  @Column()
  @Index()
  userSlackId?: string;

  @Column()
  text?: string;

  @Column()
  raw?: Buffer;
}
