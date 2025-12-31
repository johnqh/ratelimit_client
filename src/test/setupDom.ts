import { JSDOM } from 'jsdom';

if (typeof document === 'undefined') {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const { window } = dom;

  // Use type assertion via unknown to avoid DOMWindow incompatibility
  (globalThis as unknown as Record<string, unknown>).window = window;
  (globalThis as unknown as Record<string, unknown>).document = window.document;
  (globalThis as unknown as Record<string, unknown>).navigator =
    window.navigator;
}
