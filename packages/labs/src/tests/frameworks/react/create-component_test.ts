/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import {UpdatingElement} from 'updating-element';
import {property} from 'updating-element/decorators/property.js';
import {customElement} from 'updating-element/decorators/customElement.js';
import * as ReactModule from 'react';
import 'react/umd/react.development.js';
import 'react-dom/umd/react-dom.development.js';
import {createComponent} from '../../../frameworks/react/create-component.js';
import {assert} from '@esm-bundle/chai';

const elementName = 'basic-element';
@customElement(elementName)
class BasicElement extends UpdatingElement {
  @property({type: Boolean})
  bool = false;
  @property({type: String})
  str = '';
  @property({type: Number})
  num = -1;
  @property({type: Object})
  obj: {[index: string]: unknown} | null | undefined = null;
  @property({type: Array})
  arr: unknown[] | null | undefined = null;

  @property({type: Boolean, reflect: true})
  rbool = false;
  @property({type: String, reflect: true})
  rstr = '';
  @property({type: Number, reflect: true})
  rnum = -1;
  @property({type: Object, reflect: true})
  robj: {[index: string]: unknown} | null | undefined = null;
  @property({type: Array, reflect: true})
  rarr: unknown[] | null | undefined = null;

  fire(name: string) {
    this.dispatchEvent(new Event(name));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [elementName]: BasicElement;
  }
}

suite('React createComponent', () => {
  let container: HTMLElement;

  setup(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  teardown(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  const basicElementEvents = {
    onFoo: 'foo',
    onBar: 'bar',
  };

  const BasicElementComponent = createComponent(
    window.React,
    elementName,
    BasicElement,
    basicElementEvents
  );

  let el: BasicElement;

  const renderReactComponent = async (
    props?: ReactModule.ComponentProps<typeof BasicElementComponent>
  ) => {
    window.ReactDOM.render(
      window.React.createElement(BasicElementComponent, props),
      container
    );
    el = container.querySelector(elementName)! as BasicElement;
    await el.updateComplete;
  };

  test('wrapper renders custom element that updates', async () => {
    await renderReactComponent();
    assert.isOk(el);
    assert.isOk(el.hasUpdated);
  });

  test('can get ref to element', async () => {
    const elementRef = window.React.createRef();
    renderReactComponent({ref: elementRef});
    assert.equal(elementRef.current, el);
  });

  test('can set attributes', async () => {
    await renderReactComponent({id: 'id'});
    assert.equal(el.getAttribute('id'), 'id');
    await renderReactComponent({id: undefined});
    assert.equal(el.getAttribute('id'), null);
    await renderReactComponent({id: 'id2'});
    assert.equal(el.getAttribute('id'), 'id2');
  });

  test('can set properties', async () => {
    let o = {foo: true};
    let a = [1, 2, 3];
    await renderReactComponent({
      bool: true,
      str: 'str',
      num: 5,
      obj: o,
      arr: a,
    });
    assert.equal(el.bool, true);
    assert.equal(el.str, 'str');
    assert.equal(el.num, 5);
    assert.deepEqual(el.obj, o);
    assert.deepEqual(el.arr, a);
    const firstEl = el;
    // update
    o = {foo: false};
    a = [1, 2, 3, 4];
    await renderReactComponent({
      bool: false,
      str: 'str2',
      num: 10,
      obj: o,
      arr: a,
    });
    assert.equal(firstEl, el);
    assert.equal(el.bool, false);
    assert.equal(el.str, 'str2');
    assert.equal(el.num, 10);
    assert.deepEqual(el.obj, o);
    assert.deepEqual(el.arr, a);
  });

  test('can set properties that reflect', async () => {
    let o = {foo: true};
    let a = [1, 2, 3];
    await renderReactComponent({
      rbool: true,
      rstr: 'str',
      rnum: 5,
      robj: o,
      rarr: a,
    });
    const firstEl = el;
    assert.equal(el.rbool, true);
    assert.equal(el.rstr, 'str');
    assert.equal(el.rnum, 5);
    assert.deepEqual(el.robj, o);
    assert.deepEqual(el.rarr, a);
    assert.equal(el.getAttribute('rbool'), '');
    assert.equal(el.getAttribute('rstr'), 'str');
    assert.equal(el.getAttribute('rnum'), '5');
    assert.equal(el.getAttribute('robj'), '{"foo":true}');
    assert.equal(el.getAttribute('rarr'), '[1,2,3]');
    // update
    o = {foo: false};
    a = [1, 2, 3, 4];
    await renderReactComponent({
      rbool: false,
      rstr: 'str2',
      rnum: 10,
      robj: o,
      rarr: a,
    });
    assert.equal(firstEl, el);
    assert.equal(el.rbool, false);
    assert.equal(el.rstr, 'str2');
    assert.equal(el.rnum, 10);
    assert.deepEqual(el.robj, o);
    assert.deepEqual(el.rarr, a);
    assert.equal(el.getAttribute('rbool'), null);
    assert.equal(el.getAttribute('rstr'), 'str2');
    assert.equal(el.getAttribute('rnum'), '10');
    assert.equal(el.getAttribute('robj'), '{"foo":false}');
    assert.equal(el.getAttribute('rarr'), '[1,2,3,4]');
  });

  test('can listen to events', async () => {
    let fooEvent: Event | undefined,
      fooEvent2: Event | undefined,
      barEvent: Event | undefined;
    const onFoo = (e: Event) => {
      fooEvent = e;
    };
    const onFoo2 = (e: Event) => {
      fooEvent2 = e;
    };
    const onBar = (e: Event) => {
      barEvent = e;
    };
    await renderReactComponent({
      onFoo,
      onBar,
    });
    el.fire('foo');
    assert.equal(fooEvent!.type, 'foo');
    el.fire('bar');
    assert.equal(barEvent!.type, 'bar');
    fooEvent = undefined;
    barEvent = undefined;
    await renderReactComponent({
      onFoo: undefined,
    });
    el.fire('foo');
    assert.equal(fooEvent, undefined);
    el.fire('bar');
    assert.equal(barEvent!.type, 'bar');
    fooEvent = undefined;
    barEvent = undefined;
    await renderReactComponent({
      onFoo,
    });
    el.fire('foo');
    assert.equal(fooEvent!.type, 'foo');
    el.fire('bar');
    assert.equal(barEvent!.type, 'bar');
    await renderReactComponent({
      onFoo: onFoo2,
    });
    fooEvent = undefined;
    fooEvent2 = undefined;
    el.fire('foo');
    assert.equal(fooEvent, undefined);
    assert.equal(fooEvent2!.type, 'foo');
    await renderReactComponent({
      onFoo,
    });
    fooEvent = undefined;
    fooEvent2 = undefined;
    el.fire('foo');
    assert.equal(fooEvent!.type, 'foo');
    assert.equal(fooEvent2, undefined);
  });
});
