/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {html, LitElement, css, PropertyDeclaration, render} from 'lit';
import {customElement, property} from 'lit/decorators.js';

const queryParams: {
  [index: string]: string | boolean | number;
} = document.location.search
  .slice(1)
  .split('&')
  .filter((s) => s)
  .map((p) => p.split('='))
  .reduce(
    (p: {[key: string]: string | boolean}, [k, v]) => (
      (p[k!] = (() => {
        try {
          return JSON.parse(v!);
        } catch {
          return v || true;
        }
      })()),
      p
    ),
    {}
  );

// Settings
const itemCount = 250;
const itemValueCount = 99;
const updateCount = 6;

type SimpleItem = {[index: string]: string};

function makeItem(prefix: number) {
  const o: SimpleItem = {};
  for (let i = 0; i < itemValueCount; i++) {
    o['value' + i] = prefix + ': ' + i;
  }
  return o;
}

function generateData(count: number) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push(makeItem(i));
  }
  return data;
}

const data = generateData(itemCount);
const otherData = generateData(itemCount * 2).slice(itemCount);

const propertyOptions: PropertyDeclaration = {};

@customElement('x-thing')
export class XThing extends LitElement {
  static override styles = css`
    .container {
      box-sizing: border-box;
      height: 80px;
      padding: 4px;
      padding-left: 77px;
      line-height: 167%;
      cursor: default;
      background-color: white;
      position: relative;
      color: black;
      background-repeat: no-repeat;
      background-position: 10px 10px;
      background-size: 60px;
      border-bottom: 1px solid #ddd;
    }

    .from {
      display: inline;
      font-weight: bold;
    }

    .time {
      margin-left: 10px;
      font-size: 12px;
      opacity: 0.8;
    }
  `;

  @property(propertyOptions)
  from = '';
  @property(propertyOptions)
  time = '';
  @property(propertyOptions)
  subject = '';

  protected override render() {
    return html`
      <div class="container">
        <span class="from">${this.from}</span>
        <span class="time">${this.time}</span>
        <div class="subject">${this.subject}</div>
      </div>
    `;
  }
}

@customElement('x-item')
export class XItem extends LitElement {
  static override styles = css`
    .item {
      display: flex;
    }
  `;

  @property()
  item!: SimpleItem;

  protected override render() {
    return html`
      <div @click="${this.onClick}" class="item">
        <x-thing
          .from="${this.item.value0}"
          .time="${this.item.value1}"
          .subject="${this.item.value2}"
        ></x-thing>
        <x-thing
          .from="${this.item.value3}"
          .time="${this.item.value4}"
          .subject="${this.item.value5}"
        ></x-thing>
        <x-thing
          .from="${this.item.value6}"
          .time="${this.item.value7}"
          .subject="${this.item.value8}"
        ></x-thing>
        <x-thing
          .from="${this.item.value9}"
          .time="${this.item.value10}"
          .subject="${this.item.value11}"
        ></x-thing>
        <x-thing
          .from="${this.item.value12}"
          .time="${this.item.value13}"
          .subject="${this.item.value14}"
        ></x-thing>
        <x-thing
          .from="${this.item.value15}"
          .time="${this.item.value16}"
          .subject="${this.item.value17}"
        ></x-thing>
      </div>
    `;
  }

  onClick(e: MouseEvent) {
    console.log(e.type);
  }
}

@customElement('x-app')
export class XApp extends LitElement {
  @property()
  items = data;

  protected override render() {
    return html`${this.items.map(
      (item) => html`<x-item .item="${item}"></x-item>`
    )}`;
  }
}

(async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let el: XApp;

  const create = () => {
    render(html`<x-app></x-app>`, document.body);
    return document.body.firstElementChild as XApp;
  };

  const destroy = () => {
    container.innerHTML = '';
  };

  const updateComplete = () => new Promise((r) => requestAnimationFrame(r));

  const benchmark = queryParams['benchmark'];
  const getTestStartName = (name: string) => `${name}-start`;

  // Named functions are use to run the measurements so that they can be
  // selected in the DevTools profile flame chart.

  // Initial Render
  const initialRender = async () => {
    const test = 'render';
    if (benchmark === test || !benchmark) {
      const start = getTestStartName(test);
      performance.mark(start);
      create();
      await updateComplete();
      performance.measure(test, start);
      destroy();
    }
  };
  await initialRender();

  // Update: toggle data
  const update = async () => {
    const test = 'update';
    if (benchmark === test || !benchmark) {
      el = create();
      const start = getTestStartName(test);
      performance.mark(start);
      for (let i = 0; i < updateCount; i++) {
        el.items = i % 2 ? otherData : data;
        await updateComplete();
      }
      performance.measure(test, start);
      destroy();
    }
  };
  await update();

  const updateReflect = async () => {
    const test = 'update-reflect';
    if (benchmark === test || !benchmark) {
      el = create();
      const start = getTestStartName(test);
      performance.mark(start);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (propertyOptions as any).reflect = true;
      for (let i = 0; i < updateCount; i++) {
        el.items = i % 2 ? otherData : data;
        await updateComplete();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (propertyOptions as any).reflect = false;
      performance.measure(test, start);
      destroy();
    }
  };
  await updateReflect();

  // Log
  performance
    .getEntriesByType('measure')
    .forEach((m) => console.log(`${m.name}: ${m.duration.toFixed(3)}ms`));
})();
