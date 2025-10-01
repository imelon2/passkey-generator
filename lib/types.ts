export interface RunResult<TReq, TRes> {
  ok: boolean;
  request: TReq;
  response?: TRes;
  error?: { name: string; message: string; code?: string };
  at: string; // ISO
  method: "create" | "get";
}


