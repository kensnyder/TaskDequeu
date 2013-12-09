"use strict";

var noop = function() {};

/**
 * A class to allow pushing and unshifting tasks onto a stack
 * @class TaskDeque
 */
function TaskDeque() {
	if (arguments[0] === noop) {
		return;
	}
	this.initialize.apply(this, Array.prototype.slice.call(arguments));
}

/**
 * Create a subclass of TaskDeque
 * @param {Object} [methods]  Additional methods for the class, if any
 * @return {Function}  A new function with the same prototype methods as TaskDeque
 */
TaskDeque.subclass = function(methods) {
	var ctor = function() {
		this.initialize.apply(this, Array.prototype.slice.call(arguments));
	};
	ctor.prototype = new TaskDeque(noop);
	if (methods) {
		for (var name in methods) {
			if (name === 'initialize') {
				methods.initialize = (function(baseInitialize, newInitialize) {
					return function() {
						var args = Array.prototype.slice.call(arguments);
						baseInitialize.apply(this, arguments);
						newInitialize.apply(this, arguments);
					};
				})(TaskDeque.prototype.initialize, methods.initialize);
			}
			if (methods.hasOwnProperty(name)) {
				ctor.prototype[name] = methods[name];
			}
		}
	}
	return ctor;
};

TaskDeque.prototype = {
	
	/**
	 * The stack that holds functions
	 * @property _queue
	 * @type {Array}
	 * @private
	 */
	/**
	 * Lists of registered handlers indexed by event name
	 * @property _handlers
	 * @type {Array[]}
	 * @private
	 */
	/**
	 * True if the task queue has started
	 * @property hasStarted
	 * @type {Boolean}
	 */
	/**
	 * True if the task queue encountered an exception or a call to fail()
	 * @property hasFailed
	 * @type {Boolean}
	 */
	
	/**
	 * Initialize queue and private vars
	 * @constructor
	 * @return {undefined}
	 */
	initialize: function() {
		this._queue = [];
		this._handlers = {};
		this.hasStarted = false;
		this.hasFailed = false;
	},
	
	/**
	 * Add a task to the end of the task stack
	 * @method push
	 * @param {Function} fn  The task to add to the end of the stack
	 * @return {TaskDeque}
	 * @chainable
	 */
	push: function(fn) {
		this._queue.push(fn);
		return this;
	},
	
	/**
	 * Add a task to beginning of the task stack
	 * @method unshift
	 * @param {Function} fn  The task to add to the beginning of the stack
	 * @return {TaskDeque}
	 * @chainable
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
	 * @chainable
	 */
	skip: function(num) {
		num = num || 1;
		while (num-- && this._queue.length > 0) {
			this._queue.shift();
		}
		return this;
	},
	
	/**
	 * Clear out the queue and skip to the success and done callbacks
	 * @param {Any} [arg1]  An argument to pass to the done handlers
	 * @param {Any} [arg2]  A second argument to pass to the done handlers
	 * @param {Any} [argN]  (Any number of arguments are allowed)
	 * @return {TaskDeque}
	 * @chainable
	 */
	skipAll: function() {
		this._queue = [];
		var args = Array.prototype.slice.call(arguments);
		this.notify('success', args);
		this.notify('done', args);
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
		this.hasStarted = true;
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
				this.hasFailed = true;
				if (!this._handlers.error || this._handlers.error.length === 0) {
					throw e;
				}
				this._queue = [];
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
	
	/**
	 * Register a callback for the given event
	 * @method on
	 * @param {String} event  An event to bind to: error, success, done
	 * @param {Function} handler
	 * @return {TaskDeque}
	 * @chainable
	 */
	on: function(event, handler) {
		if (!this._handlers[event]) {
			this._handlers[event] = [];
		}
		this._handlers[event].push(handler);
		return this;
	},
	
	/**
	 * Unegister the given callback for the given event
	 * @method off
	 * @param {String} event
	 * @param {Function} handler
	 * @return {TaskDeque}
	 * @chainable
	 */	
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
	
	/**
	 * Run all registered handlers for the given event
	 * @method notify
	 * @param {String} event  The name of the event
	 * @param {Array} args  Arguments to pass to each one
	 * @return {TaskDeque}
	 * @chainable
	 */		
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
	},
	
	/**
	 * Create a new instance of TaskDeque that will start when this one is done
	 * @method thenStart
	 * @param {Any} [arg1]  An argument to pass to the first handler of the new instance
	 * @param {Any} [arg2]  A second argument to pass to the first handler of th e new instance
	 * @param {Any} [argN]  (Any number of arguments are allowed)
	 * @return {TaskDeque}  A new instance of TaskDeque
	 * @chainable
	 */		
	thenStart: function() {
		var args = Array.prototype.slice.call(arguments);
		var tasks = new TaskDeque();
		var start = function() {
			tasks.start.call(tasks, args);
		};
		if (this._queue.length > 0) {
			this.on('done', start);
		}
		else {
			setTimeout(start, 0);
		}
		return tasks;
	}
	
};

module.exports = TaskDeque;
