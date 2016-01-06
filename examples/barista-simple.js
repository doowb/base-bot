'use strict';

var Bot = require('../');

// create a new bot instance (named "joe")
var joe = new Bot();

// "teach" joe how to make coffee
joe.use(function(bot) {

  // `makeCoffee` is async so customers don't have to wait on joe
  bot.define('makeCoffee', function(order, cb) {
    var coffee = Object.create(order);
    cb(null, coffee);
  });
});

// tell joe to make a coffee when an order is placed
joe.on('coffee-order', function(order, cb) {
  console.log('starting coffee for', order.name);
  this.makeCoffee(order, function(err, coffee) {
    if (err) return cb(err);
    console.log(coffee.size, coffee.type, 'for', order.name, 'ready.');
    cb(null, coffee);
  });
});

joe.handle('coffee-order', {size: 'venti', type: 'mocha', name: 'brian'}, function(err, coffee) {
  if (err) return console.error(err);
  joe.handle('coffee-order', {size: 'grande', type: 'mocha', name: 'jon'}, function(err, coffee) {
    if (err) return console.error(err);
    console.log('finished');
    process.exit();
  });
});
