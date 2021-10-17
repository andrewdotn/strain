import {
  BaseEntity,
  Column,
  Entity,
  In,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";
import { uniq } from "lodash";

@Entity()
export class Channel extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Index({ unique: true })
  @Column()
  slackId?: string;

  @Column()
  created?: Date;

  @Column({ nullable: true })
  unlinked?: Date | null;

  @Column()
  name?: string;

  @Column()
  creatorSlackId?: string;

  @Column()
  topic?: string;

  @Column()
  purpose?: string;

  @Column()
  memberCount?: number;

  @Column({ select: false })
  raw?: Buffer;

  static async bySlackIdMap(slackIds: string[]) {
    const users = await Channel.find({
      where: { slackId: In(uniq(slackIds)) },
    });
    const usersBySlackId = new Map<string, Channel>();
    for (const u of users) {
      usersBySlackId.set(u.slackId!, u);
    }
    return usersBySlackId;
  }
}
