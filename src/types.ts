import { Request as OriginalPollyRequest } from '@pollyjs/core';
import { BrowserContext, Page, Request, Route } from 'playwright';

export type PollyRequest = OriginalPollyRequest & {
  requestArguments: { route: Route; request: Request };
};

export type PollyResponse = {
  status?: number;
  headers?: Record<string, string>;
  body?: Buffer | string;
};

export type PlaywrightAdapterOptions = {
  /**
   * The browser context or page where requests will be intercepted.
   */
  context: BrowserContext | Page;
  /**
   * Fires before a response is fulfilled for any intercepted request. By default it will modify all responses
   * to allow cross-origin resource sharing by setting the `access-control-allow-origin` header to `*`.
   */
  modifyResponse?: (
    response: PollyResponse,
    request: Request
  ) => PollyResponse | Promise<PollyResponse>;
  /**
   * Specifies criteria that should be matched for a request to be intercepted.
   * By default it will only match requests made by `fetch` or `XMLHttpRequest` calls.
   */
  shouldHandleRequest?: (request: Request) => boolean | Promise<boolean>;
  /**
   * Defines which mime types should be treated as text rather than binary data when persisting responses.
   * By default this includes `application/json`, `image/svg+xml` and any mime types starting with `text/`.
   */
  textMimeTypes?: (RegExp | string)[];
};
