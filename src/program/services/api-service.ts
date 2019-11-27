import fetch, {BodyInit, Response} from 'node-fetch';
import {Dict} from 'tslang';

const JSON_REQUEST_TYPE = 'application/json;charset=UTF-8';

export interface APIServiceCallOptions {
  type?: string;
  headers?: Dict<string>;
}

export class APIService {
  async post(
    url: string,
    body?: string | object,
    {type = JSON_REQUEST_TYPE, headers}: APIServiceCallOptions = {},
  ): Promise<Response> {
    if (typeof body === 'object' && type === JSON_REQUEST_TYPE) {
      body = JSON.stringify(body);
    }

    if (typeof body !== 'undefined' && typeof body !== 'string') {
      throw new Error('POST_REQUEST_BODY_NOT_SUPPORT');
    }

    return this.call('POST', url, body, {type, headers});
  }

  async call(
    method: string,
    url: string,
    body?: BodyInit,
    {type = JSON_REQUEST_TYPE, headers}: APIServiceCallOptions = {},
  ): Promise<Response> {
    let response = await fetch(url, {
      method,
      body,
      headers: {
        'Content-Type': type,
        ...headers,
      },
    });

    return response;
  }
}
