import { module, test } from 'qunit';
import { visit, find } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

let getCSS = function(el, prop) {
  let style = window.getComputedStyle(el);
  return style.getPropertyValue(prop);
}

module('Acceptance | app', function(hooks) {
  setupApplicationTest(hooks);

  test('app.scss is loaded', async function(assert) {
    await visit('/');
  
    assert.ok(getCSS(find('#app-css'), 'font-family'));
  });
  test('outputPaths are supported', async function(assert) {
    await visit('/');
  
    assert.ok(getCSS(find('#output-path-css'), 'font-family'));
  });
  test('includePaths are supported', async function(assert) {
    await visit('/');
  
    assert.ok(getCSS(find('#include-path-css'), 'animation-duration'));
  });
  test('addons can inject styles', async function(assert) {
    await visit('/');
  
    assert.ok(getCSS(find('h1'), 'font-family'));
  });

  test('app.less is loaded', async function(assert) {
    await visit('/');
    assert.equal(getCSS(find('#title'), 'color'), 'rgb(255, 0, 0)');
  });

  test('less-file.less is loaded', async function(assert) {
    await visit('/');
    assert.equal(getCSS(find('#less-file-css'), 'color'), 'rgb(0, 0, 255)');
  });

  test('less import', async function(assert) {
    await visit('/');
    assert.equal(getCSS(find('#less-import'), 'color'), 'rgb(91, 192, 222)');
  });
});


