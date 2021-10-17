import { uniq } from "lodash";
import {
  BaseEntity,
  Column,
  Entity,
  In,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Index({ unique: true })
  @Column()
  slackId?: string;

  @Column()
  name?: string;

  @Column({ nullable: true })
  realName?: number;

  @Column()
  isAdmin?: boolean;

  @Column()
  isOwner?: boolean;

  @Column()
  isDeleted?: boolean;

  @Column({ select: false })
  raw?: Buffer;

  static async bySlackIdMap(slackIds: string[]) {
    const users = await User.find({
      where: { slackId: In(uniq(slackIds)) },
    });
    const usersBySlackId = new Map<string, User>();
    for (const u of users) {
      usersBySlackId.set(u.slackId!, u);
    }
    return usersBySlackId;
  }
}
