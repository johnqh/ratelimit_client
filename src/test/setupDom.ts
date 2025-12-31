import { JSDOM } from 'jsdom';

if (typeof document === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const { window } = dom;
  const globals = globalThis as typeof globalThis & {
    window: Window;
    document: Document;
    navigator: Navigator;
  };

  globals.window = window;
  globals.document = window.document;
  globals.navigator = window.navigator;
}
