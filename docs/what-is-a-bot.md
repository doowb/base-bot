## What is this?

The goal of this project is to provide an api that makes it easy to create bots. 


## What is a bot?

This project defines a bot as an application that either has methods to interact with external services (actions) or to respond to events (handlers) or a combination of both.

This project is just the framework for creating the actions and handlers that a bot may use.
The following is a break down of the [simple barista example][../examples/barista-simple.js]

```js
var joe = new Bot();
```

For creating actions, [base-bot][] takes uses [base-methods][] to provide a plugin infrastructure.

```js
joe.use(function(bot) {
  // bot is an instance of the "joe" bot

  // `makeCoffee` is async so customers don't have to wait on joe
  bot.define('makeCoffee', function(order, cb) {
    var coffee = Object.create(order);
    cb(null, coffee);
  });
});
```

The `makeCoffee` method is now available on `joe` and takes an `order` object and returns a `coffee` through the callback.

```js
joe.makeCoffee({size: 'venti', type: 'mocha', name: 'brian'}, function(err, coffee) {
  if (err) return console.error(err);
  console.log(coffee);
});
```

Now that the `makeCoffee` "action" is available to `joe`, we can tell `joe` what to do when a `coffee-order` event occurs by setting up a handler:

```js
// tell joe to make a coffee when an order is placed
joe.on('coffee-order', function(order, cb) {
  console.log('starting coffee for', order.name);
  this.makeCoffee(order, function(err, coffee) {
    if (err) return cb(err);
    console.log(coffee.size, coffee.type, 'for', order.name, 'ready.');
    cb(null, coffee);
  });
});
```

The final step is to trigger the handler by tell `joe` to "handle" the `coffee-order` event:

```js
joe.handle('coffee-order', {size: 'venti', type: 'mocha', name: 'brian'}, function(err, coffee) {
  if (err) return console.error(err);
  joe.handle('coffee-order', {size: 'grande', type: 'mocha', name: 'jon'}, function(err, coffee) {
    if (err) return console.error(err);
    console.log('finished');
    process.exit();
  });
});
```

See the [advanced barista example](../examples/barista-advanced.js) to see how to separate the pieces into logical methods and make a barista plugin that can be reused by many bots. The advanced example also shows how a "shop" object is used to manage barista bots and assign tasks to individual bots.
