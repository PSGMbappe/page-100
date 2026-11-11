/**
 * Unit tests for FlashClock, RevealMode/HoldMode and SubPageRotator.
 * Requirements: 5.2, 5.4, 9.1–9.4, 10.3, 10.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFlashClock } from '../../src/engine/FlashClock.js';
import { createHoldMode, createRevealMode } from '../../src/engine/ToggleMode.js';
import { createSubPageRotator } from '../../src/engine/SubPageRotator.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('FlashClock', () => {
  it('toggles phase every 500 ms', () => {
    const clock = createFlashClock();
    clock.start();
    expect(clock.phase).toBe(true);
    vi.advanceTimersByTime(500);
    expect(clock.phase).toBe(false);
    vi.advanceTimersByTime(500);
    expect(clock.phase).toBe(true);
  });

  it('notifies every subscriber on each phase change', () => {
    const clock = createFlashClock();
    const a = vi.fn();
    const b = vi.fn();
    clock.subscribe(a);
    clock.subscribe(b);
    clock.start();
    vi.advanceTimersByTime(1500);
    expect(a).toHaveBeenCalledTimes(3);
    expect(b).toHaveBeenCalledTimes(3);
  });

  it('stop() resets phase to true and no further callbacks fire', () => {
    const clock = createFlashClock();
    const cb = vi.fn();
    clock.subscribe(cb);
    clock.start();
    vi.advanceTimersByTime(500);
    clock.stop();
    expect(clock.phase).toBe(true);
    cb.mockClear();
    vi.advanceTimersByTime(2000);
    expect(cb).not.toHaveBeenCalled();
  });

  it('start() twice does not create two intervals', () => {
    const clock = createFlashClock();
    const cb = vi.fn();
    clock.subscribe(cb);
    clock.start();
    clock.start();
    vi.advanceTimersByTime(500);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe stops notifications', () => {
    const clock = createFlashClock();
    const cb = vi.fn();
    const off = clock.subscribe(cb);
    off();
    clock.start();
    vi.advanceTimersByTime(1000);
    expect(cb).not.toHaveBeenCalled();
  });
});

describe('RevealMode and HoldMode', () => {
  it.each([
    ['RevealMode', createRevealMode],
    ['HoldMode', createHoldMode],
  ])('%s toggles, activates, deactivates and resets', (_name, create) => {
    const mode = create();
    expect(mode.isActive).toBe(false);
    expect(mode.toggle()).toBe(true);
    expect(mode.toggle()).toBe(false);
    mode.activate();
    expect(mode.isActive).toBe(true);
    mode.deactivate();
    expect(mode.isActive).toBe(false);
    mode.activate();
    mode.reset();
    expect(mode.isActive).toBe(false);
  });
});

describe('SubPageRotator', () => {
  it('advances every 15 s and wraps around', () => {
    const r = createSubPageRotator();
    const seen: number[] = [];
    r.onAdvance = (i) => seen.push(i);
    r.start(3);
    vi.advanceTimersByTime(15_000 * 4);
    expect(seen).toEqual([1, 2, 0, 1]);
  });

  it('hold() suppresses advancing and resume() continues from the held page', () => {
    const r = createSubPageRotator();
    const seen: number[] = [];
    r.onAdvance = (i) => seen.push(i);
    r.start(2);
    r.hold();
    vi.advanceTimersByTime(60_000);
    expect(seen).toEqual([]);
    expect(r.isHeld).toBe(true);
    r.resume();
    vi.advanceTimersByTime(15_000);
    expect(seen).toEqual([1]);
  });

  it('stop() prevents further advances', () => {
    const r = createSubPageRotator();
    const cb = vi.fn();
    r.onAdvance = cb;
    r.start(2);
    r.stop();
    vi.advanceTimersByTime(60_000);
    expect(cb).not.toHaveBeenCalled();
  });

  it('does not rotate a single-page page', () => {
    const r = createSubPageRotator();
    const cb = vi.fn();
    r.onAdvance = cb;
    r.start(1);
    vi.advanceTimersByTime(60_000);
    expect(cb).not.toHaveBeenCalled();
  });

  it('clamps an invalid sub-page count to 1 with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = createSubPageRotator();
    r.start(0);
    expect(r.currentIndex).toBe(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
