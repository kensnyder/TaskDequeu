"use strict";

var JS = require('jsclass');
var Class = require('jsclass/src/core').Class;

/**
 * A class to allow pushing and unshifting tasks onto a stack
 * @class Nextify
 */
var Nextify = new Class({
	
	initialize: function() {
		this._queue = [];
		this._handlers = {};
	},
	
	/**
	 * Add a task to the end of the task stack
	 * @method push
	 * @param {Function} fn  The task to add to the end of the stack
	 */
	push: function(fn) {
		this._queue.push(fn);
		return this;
	},
	/**
	 * Add a task to beginning of the task stack
	 * @method unshift
	 * @param {Function} fn  The task to add to the beginning of the stack
	 */
	unshift: function(fn) {
		this._queue.unshift(fn);
		return this;
	},
	
	/**
	 * Begin running tasks
	 * @method start
	 * @param {Any} [arg1]  An argument to pass to the first task
	 * @param {Any} [arg2]  A second argument to pass to the first task
	 * @param {Any} [argN]  (Any number of arguments are allowed)
	 */
	start: function() {
		var args = Array.prototype.slice.call(arguments);
		this.next.apply(this, args);
		return this;
	},
	
	/**
	 * Execute the next task with the given arguments
	 * @method next
	 * @param {Any} [arg1]  An argument to pass to the next task
	 * @param {Any} [arg2]  A second argument to pass to the next task
	 * @param {Any} [argN]  (Any number of arguments are allowed)
	 */
	next: function() {
		var args = Array.prototype.slice.call(arguments);
		if (this._queue.length > 0) {
			try {
				this._queue.shift().apply(this, args);
			}
			catch (e) {
				e.arguments = args;
//				this.hasFailed = true;
				this.notify('error', [e]);
				this.notify('done', args);
			}
		}
		else {
			this.notify('success', args);
			this.notify('done', args);
		}
	},
	
	on: function(event, handler) {
		if (!this._handlers[event]) {
			this._handlers[event] = [];
		}
		this._handlers[event].push(handler);
		return this;
	},
	
	notify: function(event, args) {
		if (!this._handlers[event]) {
			return this;
		}
		var i = 0;
		var fn;
		while ((fn = this._handlers[event][i++])) {
			fn.apply(this, args);
		}
		return this;
	}
//	unshift: function(fn, ontoCheckpoint) {},
//	remove: function(name) {},
//	skip: function(checkpointName) {},
//	// idea is to be able to shift or unshift within a set or checkpoint
//	checkpoint: function(checkpointName) {
//		this._queue.push({checkpoint:checkpointName});
//	},
//	fail: function() {
//		// like next but causes failure?
//	},
	
});

module.exports = Nextify;