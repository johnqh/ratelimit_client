import { JSDOM } from 'jsdom';

if (typeof document === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const { window } = dom;

  globalThis.window = window as unknown as Window;
  globalThis.document = window.document;
  globalThis.navigator = window.navigator;
}
