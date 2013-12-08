"use strict";

var noop = function() {};

/**
 * A class to allow pushing and unshifting tasks onto a stack
 * @class Nexty
 */
function Nexty() {
	if (arguments[0] === noop) {
		return;
	}
	this.initialize.apply(this, Array.prototype.slice.call(arguments));
}

Nexty.subclass = function(ctor) {
	ctor = ctor || function() {};
	ctor.prototype = new Nexty(noop);
};

Nexty.prototype = {
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
	 * Shift off the function at the beginning of the queue
	 * @method shift
	 * @return {Function}
	 */
	shift: function() {
		return this._queue.shift();
	},
	
	/**
	 * Pop off the function at the end of the queue
	 * @method pop
	 * @return {Function}
	 */
	pop: function() {
		return this._queue.pop();
	},
	
	/**
	 * Unshift the given number of functions
	 * @method skip
	 * @param {Number} [num]  The number of functions to skip (Defaults to 1)
	 * @return {Function}
	 */
	skip: function(num) {
		num = num || 1;
		while (num--) {
			this._queue.shift();
		}
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
				if (!this._handlers.error || this._handlers.error.length === 0) {
					throw e;
				}
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
	
	/**
	 * Throw an error
	 * @param {String} message
	 * @return {undefined}
	 */
	fail: function(message) {
		throw new Error(message);
	},
	
	on: function(event, handler) {
		if (!this._handlers[event]) {
			this._handlers[event] = [];
		}
		this._handlers[event].push(handler);
		return this;
	},
	
	off: function(event, handler) {
		if (!this._handlers[event]) {
			return this;
		}
		var handlers = [];
		for (var i = 0, len = this._handlers[event].length; i < len; i++) {
			if (this._handlers[event][i] !== handler) {
				handlers.push(this._handlers[event][i]);
			}
		}
		this._handlers[event] = handlers;
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
	
};

module.exports = Nexty;