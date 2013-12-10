var Notifier = Class.create({
	
	_events: [[window, 'scroll'], [window, 'resize'], [document, 'mousemove'], [document, 'keydown']],
	_timer: null,
	_idleTime: null,
	_interval: null,
	
	initialize: function(time) {
		this.time = time;
		
		this.initObservers();
		this.setTimer();
		this.setTimedisplay();
	},
	
	initObservers: function() {
		this._events.each(function(e) {
			Event.observe(e[0], e[1], this.onInterrupt.bind(this))
		}.bind(this))
	},
	
	onInterrupt: function(e) {
		document.fire('state:active', { idleTime: new Date() - this._idleTime });
		this.setTimer();
	},
	
	setTimer: function() {
		var oInstance=this; 	
		clearTimeout(this._timer);
		this._idleTime = new Date();
		this._timer = setTimeout(function() {
			oInstance.setTimedisplay();
		}, this.time);
	},
	
	setTimedisplay: function() {
		var dateForTime = 0;
		clearInterval( this._interval );
		this._interval = setInterval(function() {
			document.fire('state:idle', { idleTime: dateForTime });
			dateForTime++;
		}, 1000);
	}
})