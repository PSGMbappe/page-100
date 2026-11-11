/**
 * OnScreenRemote — a TV-style remote: digits, back, Fastext colours,
 * Hold and Reveal. Emits DOM CustomEvents on the container:
 *   'digit' (detail: '0'–'9'), 'backspace', 'hold', 'reveal',
 *   'fastext' (detail: 'red' | 'green' | 'yellow' | 'cyan').
 */

import type { FastextColour } from '../engine/FastextBar';

export interface OnScreenRemote {
  readonly element: HTMLElement;
  setHold(active: boolean): void;
  setReveal(active: boolean): void;
  readonly collapsed: boolean;
  toggleCollapsed(): void;
}

function button(label: string, className: string, aria?: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.className = className;
  if (aria) b.setAttribute('aria-label', aria);
  return b;
}

export function createOnScreenRemote(container: HTMLElement): OnScreenRemote {
  const root = document.createElement('div');
  root.className = 'remote';

  const toggle = button('Hide remote', 'remote-toggle');
  toggle.setAttribute('aria-expanded', 'true');

  const body = document.createElement('div');
  body.className = 'remote-body';
  body.id = 'remote-body';
  toggle.setAttribute('aria-controls', body.id);

  const emit = (type: string, detail?: string) =>
    container.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));

  const keypad = document.createElement('div');
  keypad.className = 'keypad';
  ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach((d) => {
    const b = button(d, 'key digit');
    b.addEventListener('click', () => emit('digit', d));
    keypad.append(b);
  });
  const back = button('⌫', 'key back', 'Delete last digit');
  back.addEventListener('click', () => emit('backspace'));
  const zero = button('0', 'key digit');
  zero.addEventListener('click', () => emit('digit', '0'));
  const holdBtn = button('HOLD', 'key mode hold');
  holdBtn.setAttribute('aria-pressed', 'false');
  holdBtn.addEventListener('click', () => emit('hold'));
  keypad.append(back, zero, holdBtn);

  const fastext = document.createElement('div');
  fastext.className = 'fastext-keys';
  (['red', 'green', 'yellow', 'cyan'] as FastextColour[]).forEach((colour) => {
    const b = button('', `key fx fx-${colour}`, `${colour} Fastext link`);
    b.addEventListener('click', () => emit('fastext', colour));
    fastext.append(b);
  });

  const revealBtn = button('REVEAL', 'key mode reveal');
  revealBtn.setAttribute('aria-pressed', 'false');
  revealBtn.addEventListener('click', () => emit('reveal'));

  body.append(keypad, fastext, revealBtn);
  root.append(toggle, body);
  container.append(root);

  let collapsed = false;
  const remote: OnScreenRemote = {
    element: root,
    get collapsed() {
      return collapsed;
    },
    toggleCollapsed() {
      collapsed = !collapsed;
      body.hidden = collapsed;
      toggle.textContent = collapsed ? 'Show remote' : 'Hide remote';
      toggle.setAttribute('aria-expanded', String(!collapsed));
      root.classList.toggle('collapsed', collapsed);
    },
    setHold(active) {
      holdBtn.setAttribute('aria-pressed', String(active));
      holdBtn.classList.toggle('active', active);
    },
    setReveal(active) {
      revealBtn.setAttribute('aria-pressed', String(active));
      revealBtn.classList.toggle('active', active);
    },
  };
  toggle.addEventListener('click', () => {
    remote.toggleCollapsed();
    container.dispatchEvent(new CustomEvent('remotetoggle', { bubbles: true }));
  });
  return remote;
}
