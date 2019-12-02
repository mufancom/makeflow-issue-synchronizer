export enum HTTPStatusCode {
  Ok = 200,
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
}

export interface APIResponseError {
  code: string;
  message?: string;
}

export interface APIResponse {
  data?: unknown;
  error?: APIResponseError;
}
