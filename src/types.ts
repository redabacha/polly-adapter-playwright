import type * as polly from "@pollyjs/core";
import type { BrowserContext, Page, Request, Route } from "playwright-core";

export type PollyRequest = polly.Request<{
  route: Route;
  request: Request;
}> & {
  response?: PollyResponse;
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
    request: Request,
  ) => PollyResponse | Promise<PollyResponse>;
  /**
   * Configures which routes should be intercepted. By default this is set to `**\/*` which means all routes.
   */
  routesToIntercept?: string | RegExp | ((url: URL) => boolean);
  /**
   * Specifies criteria that should be matched for a request to be intercepted.
   * By default it will only match requests made by `fetch` or `XMLHttpRequest` calls.
   */
  shouldHandleRequest?: (request: Request) => boolean | Promise<boolean>;
};
