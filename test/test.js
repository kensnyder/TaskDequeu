"use strict";

var TaskDeque = require('../TaskDeque.js');

module.exports = {
	
	"instantiation": function(test) {
		var tasks = new TaskDeque();
		test.strictEqual(tasks instanceof TaskDeque, true, 'constructor produces object');
		test.deepEqual(tasks._queue, [], 'has queue');
		test.done();
	}
	,
	"push()": function(test) {
		var tasks = new TaskDeque();
		tasks.push(function() {});
		test.strictEqual(tasks._queue.length, 1, 'task added to queue');
		
		tasks.push(function() {}).push(function() {});
		test.strictEqual(tasks._queue.length, 3, 'push is chainable');
		test.done();
	}
	,
	"start()": function(test) {
		var tasks = new TaskDeque();
		var i = 0;
		tasks.push(function() {
			i++;
		});
		test.strictEqual(i, 0, "task hasn't run yet");
		test.strictEqual(tasks.hasStarted, false, "hasStarted starts as false");
		
		tasks.start();
		test.strictEqual(i, 1, 'single function runs');
		test.strictEqual(tasks.hasStarted, true, "hasStarted gets set to true");
		test.done();
	}
	,
	"start() with args": function(test) {
		var tasks = new TaskDeque();
		var i = 0;
		tasks.push(function(num) {
			i += num;
		});
		var o = tasks.start(2);
		test.strictEqual(i, 2, 'start passes args to next task');
		test.strictEqual(o, tasks, 'start returns its object');
		test.done();
	}
	,
	"next()": function(test) {
		var tasks = new TaskDeque();
		var data = [];
		tasks.push(function() {
			data.push(1);
			this.next();
		});
		tasks.push(function() {
			data.push(2);
			this.next();
		});
		tasks.start();
		test.deepEqual(data, [1,2], 'next runs next one');
		test.done();
	}
	,
	"next() passes args to next task": function(test) {
		var tasks = new TaskDeque();
		var data = [];
		tasks.push(function() {
			data.push(1);
			this.next(2);
		});
		tasks.push(function(num) {
			data.push(num);
			this.next();
		});
		tasks.start();
		test.deepEqual(data, [1,2], 'next runs next one');
		test.done();
	}
	,
	"unshift()": function(test) {
		var tasks = new TaskDeque();
		var data = [];
		tasks.push(function() {
			data.push(1);
			this.next();
		});
		tasks.push(function() {
			tasks.unshift(function() {
				data.push(3);
				this.next();
			});
			data.push(2);
			this.next();
		});
		tasks.push(function() {
			data.push(4);
			this.next();
		});
		tasks.start();
		test.deepEqual(data, [1,2,3,4], 'unshift can be called after starting');
		test.done();
	}
	,
	"on('done')": function(test) {
		test.expect(1);
		var tasks = new TaskDeque();
		var data = [];
		tasks.push(function() {
			data.push(1);
			this.next();
		});
		tasks.push(function() {
			setTimeout(function() {				
				data.push(2);
				tasks.next();
			}, 10)
		});
		tasks.on('done', function() {			
			test.deepEqual(data, [1,2], 'done method registers a done callback');
			test.done();
		});
		tasks.start();
	}
	,
	"off('done')": function(test) {
		test.expect(1);
		var tasks = new TaskDeque();
		var data = [];
		tasks.push(function() {
			data.push(1);
			this.next();
		});
		var onemore = function() {
			data.push(2);
		};
		tasks.on('done', onemore);
		tasks.on('done', onemore);
		tasks.off('done', onemore);
		tasks.start();
		test.deepEqual(data, [1], 'off() removes callback');
		test.done();
	}
	,
	"next() passes args to done()": function(test) {
		test.expect(4);
		var tasks = new TaskDeque();
		tasks.push(function() {
			this.next(1, 2);
		});
		tasks
		.on('done', function(one, two) {			
			test.strictEqual(one, 1, 'next passes first arg to done');
			test.strictEqual(two, 2, 'next passes second arg to done');
		})
		.on('done', function(one, two) {			
			test.strictEqual(one, 1, 'next passes first arg to second done');
			test.strictEqual(two, 2, 'next passes second arg to second done');
			test.done();
		});
		tasks.start();
	}
	,
	"on('error')": function(test) {
		test.expect(5);
		var tasks = new TaskDeque();
		tasks.push(function() {
			throw new Error('oops');
		});
		tasks.on('error', function(error) {			
			test.strictEqual(error instanceof Error, true, 'Error passed to .error()');
			test.strictEqual(error.message, 'oops', 'Error has correct message');
			test.deepEqual(error.arguments, [1], 'Error has arguments property');
		});
		tasks.on('done', function(one) {			
			test.strictEqual(true, true, 'done() callbacks called after error()');
			test.strictEqual(one, 1, 'done() callbacks called after error() still get args');
			test.done();
		});
		tasks.start(1);
	}
	,
	"fail()": function(test) {
		test.expect(5);
		var tasks = new TaskDeque();
		tasks.push(function() {
			this.fail('oops');
		});
		tasks.on('error', function(error) {			
			test.strictEqual(error instanceof Error, true, 'Error passed to .error()');
			test.strictEqual(error.message, 'oops', 'Error has correct message');
			test.deepEqual(error.arguments, [1], 'Error has arguments property');
		});
		tasks.on('done', function(one) {			
			test.strictEqual(true, true, 'done() callbacks called after error()');
			test.strictEqual(one, 1, 'done() callbacks called after error() still get args');
			test.done();
		});
		tasks.start(1);
	}
	,
	"shift()": function(test) {
		var tasks = new TaskDeque();
		var data = [];
		tasks.push(function() {
			data.push(1);
			this.shift();
			this.next();
		});
		tasks.push(function() {
			data.push(2);
			this.next();
		});
		tasks.push(function() {
			data.push(3);
			this.next();
		});
		tasks.start();
		test.deepEqual(data, [1,3], 'shift should shift off one');
		test.done();
	}
	,
	"shift() returns function": function(test) {
		var tasks = new TaskDeque();
		var data = [];
		tasks.push(function() {
			data.push(1);
			var two = this.shift();
			var three = this.shift();
			three.call(this);
			two.call(this);
			this.next();
		});
		tasks.push(function() {
			data.push(2);
			this.next();
		});
		tasks.push(function() {
			data.push(3);
			this.next();
		});
		tasks.start();
		test.deepEqual(data, [1,3,2], 'shift functions can re-arrange order');
		test.done();
	}
	,
	"pop()": function(test) {
		var tasks = new TaskDeque();
		var data = [];
		tasks.push(function() {
			data.push(1);
			this.pop();
			this.next();
		});
		tasks.push(function() {
			data.push(2);
			this.next();
		});
		tasks.push(function() {
			data.push(3);
			this.next();
		});
		tasks.start();
		test.deepEqual(data, [1,2], 'pop should shift off one');
		test.done();
	}
	,
	"pop() returns function": function(test) {
		var tasks = new TaskDeque();
		var data = [];
		tasks.push(function() {
			data.push(1);			
			var three = this.pop();
			var two = this.pop();
			three.call(this);
			two.call(this);
			this.next();
		});
		tasks.push(function() {
			data.push(2);
			this.next();
		});
		tasks.push(function() {
			data.push(3);
			this.next();
		});
		tasks.start();
		test.deepEqual(data, [1,3,2], 'pop can rearrange order');
		test.done();
	}
	,
	"skip()": function(test) {
		var tasks = new TaskDeque();
		var data = [];
		tasks.push(function() {
			data.push(1);
			this.skip();
			this.next();
		});
		tasks.push(function() {
			data.push(2);
			this.next();
		});
		tasks.push(function() {
			data.push(3);
			this.skip(2);
			this.next();
		});
		tasks.push(function() {
			data.push(4);
			this.next();
		});
		tasks.push(function() {
			data.push(5);
			this.next();
		});
		tasks.push(function() {
			data.push(6);
			this.next();
		});
		tasks.start();
		test.deepEqual(data, [1,3,6], 'skip shifts off the given number');
		test.done();
	}
	,
	"skipAll()": function(test) {
		var tasks = new TaskDeque();
		var data = [];
		tasks.push(function() {
			data.push(1);
			this.skipAll();
			this.next();
		});
		tasks.push(function() {
			data.push(2);
			this.next();
		});
		tasks.push(function() {
			data.push(3);
			this.next();
		});
		tasks.start();
		test.deepEqual(data, [1], 'skipAll resets the queue');
		test.done();
	}
	,
	"thenStart()": function(test) {
		var tasks = new TaskDeque();
		var data = [];
		tasks.push(function() {
			data.push(1);
			this.next();
		});
		var tasks2 = tasks.thenStart();
		test.strictEqual(tasks2 instanceof TaskDeque, true, 'thenStart returns new deque');
		tasks2.push(function() {
			data.push(3);
			this.next();
		});
		tasks.push(function() {
			data.push(2);
			this.next();
		});
		tasks2.push(function() {
			data.push(4);
			this.next();
		});
		tasks.start();
		test.deepEqual(data, [1,2,3,4], 'tasks execute in the correct order');
		test.done();
	}
	,
	"subclass()": function(test) {
		var Workhorse = TaskDeque.subclass({
			initialize: function() {
				this.data = [];
			},
			multiply: function(by) {
				for (var i = 0; i < this.data.length; i++) {
					this.data[i] = this.data[i] * by;
				}
			}
		});
		var tasks = new Workhorse();
		test.strictEqual(tasks instanceof Workhorse, true, 'subclass returns a function');
		test.strictEqual(tasks instanceof TaskDeque, true, 'prototype chain is correct');
		tasks.push(function() {
			this.data.push(1);
			this.next();
		});
		tasks.push(function() {
			this.data.push(2);
			this.next();
		});
		tasks.start();
		test.deepEqual(tasks.data, [1,2], 'subclass behaves the same way');
		tasks.multiply(3);
		test.deepEqual(tasks.data, [3,6], 'subclass method added ok');
		test.done();
	}
	,
	"timeout": function(test) {		
		test.expect(3);
		var tasks = new TaskDeque();
		test.strictEqual(typeof tasks.timeout, 'number', 'timeout property is a number');
		
		var data = [];
		tasks.timeout = 0.030;
		tasks.push(function() {
			data.push(1);
			setTimeout(function() {	
				tasks.next();
			}, 60);
		});
		tasks.push(function() {
			data.push(2);
			tasks.next();
		});
		tasks.on('timeout', function(letter) {
			test.strictEqual(letter, 'a', 'timeout handlers are called with args');
		});
		setTimeout(function() {				
			test.deepEqual(data, [1], 'script times out');
			test.done();
		}, 90);
		tasks.start('a');
	}
	,
	"timeout cleared on completion": function(test) {		
		test.expect(1);
		var tasks = new TaskDeque();
		var data = [];
		tasks.timeout = 0.030;
		tasks.push(function() {
			data.push(1);
			tasks.next();
		});
		tasks.on('timeout', function() {	
			data.push(2);
		});
		setTimeout(function() {				
			test.deepEqual(data, [1], 'timeout event not called');
			test.done();
		}, 60);
		tasks.start();
	}
	,
	"resetTimeout()": function(test) {		
		test.expect(1);
		var tasks = new TaskDeque();
		var data = [];
		tasks.timeout = 0.030;
		tasks.push(function() {
			data.push(1);
			setTimeout(function() {	
				tasks.next();
			}, 60);
			setTimeout(function() {	
				tasks.timeout = 1;
				tasks.resetTimeout();
			}, 15);
		});
		tasks.push(function() {
			data.push(2);
			tasks.next();
		});
		setTimeout(function() {				
			test.deepEqual(data, [1,2], 'script times out');
			test.done();
		}, 90);
		tasks.start();
	}
	
};