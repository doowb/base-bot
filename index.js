/*!
 * base-bot <https://github.com/doowb/base-bot>
 *
 * Copyright (c) 2015, Brian Woodward.
 * Licensed under the MIT License.
 */

'use strict';

var Base = require('base-methods');
var async = require('async');

/**
 * Create a new instance of a BaseBot with provided options.
 *
 * ```js
 * var bot = new BaseBot();
 * ```
 *
 * @param {Object} `options` Options to configure the github bot.
 * @api public
 */

function BaseBot(options) {
  if (!(this instanceof BaseBot)) {
    return new BaseBot(options);
  }
  this.options = options || {};
  Base.call(this);
}

Base.extend(BaseBot);

/**
 * Handle a payload object. The `payload` will be passed to all registered handlers.
 * Handlers may modify the `payload` and return it in their `callback`.
 * The aggregated results will be returned in the `handle` `callback`.
 *
 * ```js
 * bot.handle('issue', payload, function(err, results) {
 *   if (err) return console.error(err);
 *   console.log(results);
 * });
 * ```
 *
 * @param  {String} `event` Event type to handle. Only listeners registered for this type will be notified.
 * @param  {Object} `payload` Payload object to handle.
 * @param  {Function} `cb` Callback to notify call when finished handling payload.
 * @api public
 */

BaseBot.prototype.handle = function(event, payload, cb) {
  if (!this.hasListeners(event)) {
    return cb(null, payload);
  }
  var handlers = this.listeners(event);
  async.reduce(handlers, payload, function(acc, handler, next) {
    return handler.call(this, payload, next);
  }.bind(this), cb);
};

/**
 * Add a specific `on` and `handle` methods for an event.
 *
 * ```js
 * bot.handler('issue');
 * bot.onIssue(function(payload, cb) { cb(null, payload); });
 * bot.handleIssue(payload, function(err, results) {
 *   if (err) return console.error(err);
 *   console.log(results);
 * });
 * ```
 *
 * @param  {String} `method` Name of the methods to add.
 * @return {Object} `this` for chaining.
 * @api public
 */

BaseBot.prototype.handler = function(method) {
  var name = namify(method);
  this.define('on' + name, function(fn) {
    return this.on(method, fn);
  });

  this.define('handle' + name, function(payload, cb) {
    this.handle(method, payload, cb);
  });
  return this;
};

/**
 * Add a specific `on` and `handle` methods for an array of events.
 *
 * ```js
 * bot.handlers(['issue', 'commit']);
 *
 * bot.onIssue(function(payload, cb) { cb(null, payload); });
 * bot.onCommit(function(payload, cb) { cb(null, payload); });
 *
 * bot.handleIssue(payload, function(err, results) {
 *   if (err) return console.error(err);
 *   console.log(results);
 * });
 *
 * bot.handleCommit(payload, function(err, results) {
 *   if (err) return console.error(err);
 *   console.log(results);
 * });
 * ```
 *
 * @param  {String|Array} `methods` Array of method names to add.
 * @return {Object} `this` for chaining.
 * @api public
 */

BaseBot.prototype.handlers = function(methods) {
  methods = arrayify(methods);
  methods.forEach(this.handler.bind(this));
  return this;
};

/**
 * Used to camelcase the dynamically added method names.
 *
 * @param  {String} `str` String containing `_`, `.`, `-` or whitespace that will be camelcased.
 * @return {String} camelcased string.
 */

function camelcase(str) {
  if (str.length === 1) {
    return str.toLowerCase();
  }
  str = str.replace(/^[\W_]+|[\W_]+$/g, '').toLowerCase();
  return str.replace(/[\W_]+(\w|$)/g, function(_, ch) {
    return ch.toUpperCase();
  });
}

/**
 * Used to namify the dynamically added method names.
 *
 * @param  {String} `str` String to be namified.
 * @return {String} namified string.
 */

function namify(str) {
  str = camelcase(str);
  return str.substring(0, 1).toUpperCase() + str.substring(1);
}

/**
 * Arrayify a value.
 *
 * @param  {Mixed} `val` Value to arrayify.
 * @return {Array} arrayified value
 */

function arrayify(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

/**
 * Exposes `BaseBot`.
 */

module.exports = BaseBot;

