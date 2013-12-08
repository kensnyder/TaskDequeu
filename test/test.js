"use strict";

var Nextify = require('../Nextify.js');

module.exports = {
	
	"instantiation": function(test) {
		var tasks = new Nextify();
		test.strictEqual(tasks instanceof Nextify, true, 'constructor produces object');
		test.deepEqual(tasks._queue, [], 'has queue');
		test.done();
	}
	,
	"push()": function(test) {
		var tasks = new Nextify();
		tasks.push(function() {});
		test.strictEqual(tasks._queue.length, 1, 'task added to queue');
		
		tasks.push(function() {}).push(function() {});
		test.strictEqual(tasks._queue.length, 3, 'push is chainable');
		test.done();
	}
	,
	"start()": function(test) {
		var tasks = new Nextify();
		var i = 0;
		tasks.push(function() {
			i++;
		});
		test.strictEqual(i, 0, "task hasn't run yet");
		
		tasks.start();
		test.strictEqual(i, 1, 'single function runs');
		test.done();
	}
	,
	"start() with args": function(test) {
		var tasks = new Nextify();
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
		var tasks = new Nextify();
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
		var tasks = new Nextify();
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
		var tasks = new Nextify();
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
	"done()": function(test) {
		test.expect(1);
		var tasks = new Nextify();
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
	"next() passes args to done()": function(test) {
		test.expect(4);
		var tasks = new Nextify();
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
	"error()": function(test) {
		test.expect(5);
		var tasks = new Nextify();
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
	
};