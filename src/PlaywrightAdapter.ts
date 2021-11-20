import PollyAdapter from '@pollyjs/adapter';
import { Request, Route } from 'playwright';
import { PlaywrightAdapterOptions, PollyRequest, PollyResponse } from './types';

export class PlaywrightAdapter extends PollyAdapter {
  public static get id() {
    return 'playwright';
  }

  public static get defaultOptions() {
    return {
      modifyResponse: (response: PollyResponse) => ({
        ...response,
        headers: { 'access-control-allow-origin': '*', ...response.headers }
      }),
      shouldHandleRequest: (request: Request) =>
        ['fetch', 'xhr'].includes(request.resourceType()),
      textMimeTypes: ['application/json', 'image/svg+xml', /text\/.*/]
    };
  }

  public get defaultOptions() {
    return PlaywrightAdapter.defaultOptions;
  }

  public readonly options!: Required<PlaywrightAdapterOptions>;

  public onConnect() {
    return this.options.context.route('**/*', this.handleRoute);
  }

  public async onDisconnect() {
    try {
      return await this.options.context.unroute('**/*', this.handleRoute);
    } catch (e) {
      // ignore errors
      return undefined;
    }
  }

  public async passthroughRequest(pollyRequest: PollyRequest) {
    const { request } = pollyRequest.requestArguments;
    const response = await this.options.context.request.fetch(request);
    const headers = response.headers();

    return {
      statusCode: response.status(),
      headers,
      body: this.isTextMimeType(headers['content-type'])
        ? await response.text()
        : (await response.body()).toString('base64')
    };
  }

  public async respondToRequest(
    pollyRequest: PollyRequest & {
      response: {
        statusCode: number;
        headers: Record<string, string>;
        body?: string;
      };
    },
    error: Error
  ) {
    const {
      requestArguments: { request, route },
      response
    } = pollyRequest;

    if (error) {
      return route.abort();
    }

    let body: Buffer | string | undefined;

    if (response.body) {
      body = this.isTextMimeType(response.headers['content-type'])
        ? response.body
        : Buffer.from(response.body, 'base64');
    }

    return route.fulfill(
      await this.options.modifyResponse(
        { status: response.statusCode, headers: response.headers, body },
        request
      )
    );
  }

  private handleRoute = async (route: Route, request: Request) => {
    if (await this.options.shouldHandleRequest(request)) {
      (this as any).handleRequest({
        url: request.url(),
        method: request.method(),
        headers: await request.allHeaders(),
        body: request.postData(),
        requestArguments: { route, request }
      });
    } else {
      route.continue();
    }
  };

  private isTextMimeType(mimeType: string) {
    return this.options.textMimeTypes.some(textMimeType =>
      typeof textMimeType === 'string'
        ? mimeType.startsWith(textMimeType)
        : textMimeType.test(mimeType)
    );
  }
}
