


BLT.event = function () {
    this.campaign = '';
    this.action = '';
    this.attributes = {};
    this.pagetoken = '';    
    this.setAttribute('timestamp', OWA.util.getCurrentUnixTimestamp());
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

