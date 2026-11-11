/**
 * Unit tests for GridRenderer layout and the OnScreenRemote.
 * Requirements: 1.2, 1.5, 13.1–13.10
 */

import { describe, it, expect, vi } from 'vitest';
import { computeLayout } from '../../src/ui/GridRenderer.js';
import { createOnScreenRemote } from '../../src/ui/OnScreenRemote.js';

describe('computeLayout', () => {
  it.each([
    [1280, 800, 1],
    [1280, 800, 2],
    [1920, 1080, 1],
    [800, 600, 2],
    [375, 500, 3],
  ])('fits %s×%s at dpr %s with whole-pixel cells and a ~4:3 grid', (w, h, dpr) => {
    const l = computeLayout(w, h, dpr);
    expect(Number.isInteger(l.cellW)).toBe(true);
    expect(Number.isInteger(l.cellH)).toBe(true);
    expect(l.canvasW).toBe(l.cellW * 40);
    expect(l.canvasH).toBe(l.cellH * 25);
    expect(l.cssW).toBeCloseTo(l.canvasW / dpr);
    expect(l.cssH).toBeCloseTo(l.canvasH / dpr);
    expect(l.cssW).toBeLessThanOrEqual(w);
    expect(l.cssH).toBeLessThanOrEqual(h);
    const ratio = l.canvasW / l.canvasH;
    expect(ratio).toBeGreaterThanOrEqual(1.3);
    expect(ratio).toBeLessThanOrEqual(1.4);
  });

  it('backing store is the CSS size multiplied by devicePixelRatio', () => {
    const one = computeLayout(1000, 750, 1);
    const two = computeLayout(1000, 750, 2);
    expect(two.canvasW).toBeGreaterThan(one.canvasW);
    expect(two.canvasW / 2).toBeCloseTo(two.cssW);
  });
});

describe('OnScreenRemote', () => {
  function setup() {
    const container = document.createElement('div');
    document.body.append(container);
    const remote = createOnScreenRemote(container);
    return { container, remote };
  }

  it('digit buttons dispatch digit events with their value', () => {
    const { container } = setup();
    const seen: string[] = [];
    container.addEventListener('digit', (e) => seen.push((e as CustomEvent<string>).detail));
    const buttons = [...container.querySelectorAll<HTMLButtonElement>('button.digit')];
    expect(buttons.map((b) => b.textContent)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
    buttons.forEach((b) => b.click());
    expect(seen).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
  });

  it('backspace, hold, reveal and Fastext buttons dispatch their events', () => {
    const { container } = setup();
    const handler = vi.fn();
    ['backspace', 'hold', 'reveal', 'fastext'].forEach((t) => container.addEventListener(t, (e) => handler(t, (e as CustomEvent).detail)));
    container.querySelector<HTMLButtonElement>('.back')!.click();
    container.querySelector<HTMLButtonElement>('.hold')!.click();
    container.querySelector<HTMLButtonElement>('.reveal')!.click();
    container.querySelector<HTMLButtonElement>('.fx-yellow')!.click();
    expect(handler.mock.calls).toEqual([
      ['backspace', null],
      ['hold', null],
      ['reveal', null],
      ['fastext', 'yellow'],
    ]);
  });

  it('collapse toggle hides the body and updates its label', () => {
    const { container, remote } = setup();
    const toggle = container.querySelector<HTMLButtonElement>('.remote-toggle')!;
    const body = container.querySelector<HTMLElement>('.remote-body')!;
    toggle.click();
    expect(remote.collapsed).toBe(true);
    expect(body.hidden).toBe(true);
    expect(toggle.textContent).toBe('Show remote');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    expect(body.hidden).toBe(false);
    expect(toggle.textContent).toBe('Hide remote');
  });

  it('reflects Hold and Reveal state on the buttons', () => {
    const { container, remote } = setup();
    remote.setHold(true);
    remote.setReveal(true);
    expect(container.querySelector('.hold')!.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('.reveal')!.getAttribute('aria-pressed')).toBe('true');
    remote.setHold(false);
    expect(container.querySelector('.hold')!.getAttribute('aria-pressed')).toBe('false');
  });
});
