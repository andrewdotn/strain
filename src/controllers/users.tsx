import type { Request, Response } from "express";
import React from "react";
import { htmlPage } from "../util";
import { User } from "../models/user";

export async function userListPage(req: Request, res: Response) {
  const users = await User.find({
    order: { isDeleted: "ASC", realName: "ASC" },
  });

  res.send(
    htmlPage(
      <div>
        <h2>Users</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Real name</th>
              <th>Name</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.realName}</td>
                <td>
                  <a href={`/users/${u.slackId}`}>{u.name}</a>
                </td>
                <td>
                  {u.isOwner && (
                    <span className="badge badge-pill badge-primary">
                      Owner
                    </span>
                  )}
                  {u.isAdmin && (
                    <span className="badge badge-pill badge-info">Admin</span>
                  )}
                  {u.isDeleted && (
                    <span className="badge badge-pill badge-danger">
                      Deleted
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );
}

export async function userDetail(req: Request, res: Response) {
  const user = await User.findOneOrFail({ slackId: req.params.userId });
  const raw = await User.findOne({ where: { id: user.id }, select: ["raw"] });

  res.send(
    htmlPage(
      <div>
        <h1>{user.realName}</h1>
        <h2>{user.name}</h2>
        <pre>{raw.raw.toString()}</pre>
      </div>
    )
  );
}
