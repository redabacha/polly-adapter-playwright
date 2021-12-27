# polly-adapter-playwright

[![npm](https://shields.io/npm/v/polly-adapter-playwright)](https://www.npmjs.com/package/polly-adapter-playwright)
[![license](https://shields.io/github/license/redabacha/polly-adapter-playwright)](https://github.com/redabacha/polly-adapter-playwright/blob/main/LICENSE)

[Polly.JS](https://netflix.github.io/pollyjs/#/) adapter for [Playwright](https://playwright.dev/). This adapter will attach to a given browser context or page from Playwright for recording and replaying requests.

## Installation

npm:

```
npm install --save-dev polly-adapter-playwright
```

yarn:

```
yarn add --dev polly-adapter-playwright
```

## Usage

This adapter works across all browsers supported by Playwright. Simply create a new browser context or page and pass it as an option to this adapter when creating a new Polly instance.

### Examples

With a new page:

```ts
import { Polly } from '@pollyjs/core';
import { PlaywrightAdapter } from 'polly-adapter-playwright';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

// register the playwright adapter so it's accessible by all future polly instances
Polly.register(PlaywrightAdapter);

const polly = new Polly('<Recording Name>', {
  adapters: ['playwright'],
  adapterOptions: {
    playwright: {
      context: page
    }
  }
});

// perform page interactions
...

// cleanup
await polly.stop();
await page.close();
```

With a new browser context:

```ts
import { Polly } from '@pollyjs/core';
import { PlaywrightAdapter } from 'polly-adapter-playwright';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext();

// register the playwright adapter so it's accessible by all future polly instances
Polly.register(PlaywrightAdapter);

const polly = new Polly('<Recording Name>', {
  adapters: ['playwright'],
  adapterOptions: {
    playwright: {
      context
    }
  }
});

const page = await context.newPage();

// perform page interactions
...

// cleanup
await polly.stop();
await page.close();
await context.close();
```

## Options

| Name                  | Description                                                                                                                                                                                                  |
| :-------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `context`             | The browser context or page where requests will be intercepted.                                                                                                                                              |
| `modifyResponse`      | Fires before a response is fulfilled for any intercepted request. By default it will modify all responses to allow cross-origin resource sharing by setting the `access-control-allow-origin` header to `*`. |
| `shouldHandleRequest` | Specifies criteria that should be matched for a request to be intercepted. By default it will only match requests made by `fetch` or `XMLHttpRequest` calls.                                                 |
