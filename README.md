# ember-cli-sass-less

> _and in the darkness bind them_

Combines [ember-cli-sass](https://github.com/adopted-ember-addons/ember-cli-sass) and [ember-cli-less](https://github.com/gpoitch/ember-cli-less) into one (somewhat hacky) addon. Mainly to assist in migration from less to sass.

## Installation

```
ember install ember-cli-sass-less
```

## Configuration

Specify the include paths in ember-cli-build.js:

```
let app = new EmberApp({
  sassOptions: {
    //standard ember-cli-sass options go here
    excludeFiles: [] // `app/styles` files not to be process as sass files
  },
  lessOptions: {
    //standard ember-cli-less options go here
    lessFiles: ['app'], // `app/styles` files to process as less files
    lessSuffix: 'my-suffix' // defaults to `.less`, output name suffix (ex: app --> app.less.css) 
  }
});
```
