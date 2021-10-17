import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
@Index(["method", "params", "timestamp"])
export class ApiResult extends BaseEntity {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  method?: string;

  @Column()
  params?: string;

  @Column()
  timestamp?: number;

  // If a download returns data we already have, we throw away the copy, but
  // update this timestamp so that we know that the data was constant in the
  // period [timestamp, lastDupeTime].
  @Column({ nullable: true })
  lastDupeTime?: number;

  @Column({ select: false })
  data?: Buffer;
}
