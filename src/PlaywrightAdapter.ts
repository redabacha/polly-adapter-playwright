import PollyAdapter from '@pollyjs/adapter';
import type { Request, Route } from 'playwright-core';
import type {
  PlaywrightAdapterOptions,
  PollyRequest,
  PollyResponse
} from './types';

export class PlaywrightAdapter extends PollyAdapter<
  Partial<PlaywrightAdapterOptions>
> {
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
        ['fetch', 'xhr'].includes(request.resourceType())
    };
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
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

  public async onFetchResponse(pollyRequest: PollyRequest) {
    const { request } = pollyRequest.requestArguments;
    const response = await this.options.context.request.fetch(request);
    const body = await response.body();

    return {
      statusCode: response.status(),
      headers: response.headers(),
      ...(this.isBufferUtf8Representable(body)
        ? {
            body: body.toString('utf8'),
            encoding: 'utf8'
          }
        : {
            body: body.toString('base64'),
            encoding: 'base64'
          })
    };
  }

  public async onRespond(pollyRequest: PollyRequest, error: Error) {
    const {
      requestArguments: { request, route },
      response
    } = pollyRequest;

    if (error) {
      return route.abort();
    }

    let body: Buffer | string | undefined;

    if (response?.body) {
      body = this.isBufferUtf8Representable(Buffer.from(response.body, 'utf8'))
        ? response.body
        : Buffer.from(response.body, 'base64');
    }

    return route.fulfill(
      await this.options.modifyResponse(
        {
          status: response?.statusCode,
          headers: response?.headers,
          body
        },
        request
      )
    );
  }

  private handleRoute = async (route: Route, request: Request) => {
    if (await this.options.shouldHandleRequest(request)) {
      this.handleRequest({
        url: request.url(),
        method: request.method(),
        headers: await request.allHeaders(),
        body: request.postData() ?? undefined,
        requestArguments: { route, request }
      });
    } else {
      route.continue();
    }
  };

  // https://github.com/Netflix/pollyjs/blob/9f4179a76d4c09f26c4cd21683bf00ac3f99ac59/packages/@pollyjs/utils/src/utils/is-buffer-utf8-representable.js
  private isBufferUtf8Representable(buffer: Buffer) {
    const utfEncodedBuffer = buffer.toString('utf8');
    const reconstructedBuffer = Buffer.from(utfEncodedBuffer, 'utf8');

    return reconstructedBuffer.equals(buffer);
  }
}
