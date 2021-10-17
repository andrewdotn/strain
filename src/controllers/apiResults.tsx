import { ApiResult } from "../models/api-result";
import React from "react";
import { htmlPage } from "../util";
import type { Request, Response } from "express";

export async function apiResultsPage(req: Request, res: Response) {
  const apiResults = await ApiResult.find({
    order: { timestamp: "DESC" },
  });

  res.send(
    htmlPage(
      <div>
        <h2>Api results</h2>
        <div>
          <table>
            <tr>
              <thead>
                <th>Method</th>
                <th>Params</th>
                <th>Timestamp</th>
              </thead>
            </tr>
            {apiResults.map((r) => (
              <tr>
                <td>{r.method}</td>
                <td>{r.params}</td>
                <td>
                  <a href={`/apiResults/${r.id}`}>
                    {new Date(r.timestamp!).toISOString()}
                  </a>
                </td>
              </tr>
            ))}
          </table>
        </div>
      </div>
    )
  );
}

export async function apiResultsDetail(req: Request, res: Response) {
  const result = await ApiResult.findOneOrFail({
    where: { id: req.params.id },
    select: ["method", "params", "timestamp", "data"],
  });

  res.send(
    htmlPage(
      <div>
        <dl>
          <dt>Method</dt>
          <dd>{result.method}</dd>
          <dt>Params</dt>
          <dd>{result.params}</dd>
          <dt>Timestamp</dt>
          <dd>{new Date(result.timestamp!).toISOString()}</dd>
        </dl>
        <pre>
          {JSON.stringify(JSON.parse(result.data!.toString()), null, 2)}
        </pre>
      </div>
    )
  );
}
