﻿

BLT.event = function () {
    this.campaign = '';
    this.action = '';
    this.attributes = {};
    this.pagetoken = '';    
    this.setAttribute('timestamp', BLT.util.getCurrentUnixTimestamp());
}

BLT.event.prototype = {
    get: function (name) {
        if (this.attributes.hasOwnProperty(name)) {
            return this.attributes[name];
        }
    },
    setAttribute: function (keyname, attrvalue) {
        this.attributes[keyname] = attrvalue;
    },
    setEventType: function (event_type) {
        this.set("event_type", event_type);
    },
    getAttributes: function () {
        return this.attributes;
    },
    merge: function (attribs) {
        for (keyname in attribs) {
            if (attribs.hasOwnProperty(keyname)) {
                this.set(param, attribs[keyname]);
            }
        }
    },
    isSet: function (name) {
        if (this.attributes.hasOwnProperty(name)) {
            return true;
        }
    }
}

OWA.eventqueue = function () {
    BLT.debug('Command Queue object created');
    var asyncCmds = [];
    var is_paused = false;
}

OWA.eventqueue.prototype = {
    push: function (cmd, callback) {

        //alert(func[0]);
        var args = Array.prototype.slice.call(cmd, 1);
        //alert(args);

        var obj_name = '';
        var method = '';
        var check = OWA.util.strpos(cmd[0], '.');

        if (!check) {
            obj_name = 'BLT';
            method = cmd[0];
        } else {
            var parts = cmd[0].split('.');
            obj_name = parts[0];
            method = parts[1];
        }

        BLT.debug('eventqueue object name %s', obj_name);
        BLT.debug('eventqueue object method name %s', method);

        if (method === "pause-") {
            this.pause();
        }

        // check to see if the command queue has been paused
        // used to stop tracking		
        if (!this.is_paused) {

            // is BLT created?
            if (typeof window[obj_name] == "undefined") {
                BLT.debug('making global object named: %s', obj_name);
                window[obj_name] = new BLT.tracker({ globalObjectName: obj_name });
            }
            window[obj_name][method].apply(window[obj_name], args);
        }

        if (method === "unpause-blt") {
            this.unpause();
        }

        if (callback && (typeof callback == 'function')) {
            callback();
        }
    },

    loadCmds: function (cmds) {
        this.asyncCmds = cmds;
    },

    process: function () {

        var that = this;
        var callback = function () {
            // when the handler says it's finished (i.e. runs the callback)
            // We check for more tasks in the queue and if there are any we run again
            if (that.asyncCmds.length > 0) {
                that.process();
            }
        }

        // give the first item in the queue & the callback to the handler
        this.push(this.asyncCmds.shift(), callback);

		/*
		for (var i=0; i < this.asyncCmds.length;i++) {
			this.push(this.asyncCmds[i]);
		}
		*/
    },

    pause: function () {

        this.is_paused = true;
        BLT.debug('Pausing EventQueue');
    },

    unpause: function () {

        this.is_paused = false;
        BLT.debug('Un-pausing EventQueue');
    }
};


