/**
 * Base widget for all widgets within Adx.
 *
 * Widgets are self-contained "controllers" for models and views. Use a widget when you have a number of
 * models and views that you want to perform a number of complex but related operations.
 *
 * Because widgets are eventually rendered, to the outside they resemble views with a lot more state-like
 * functionality.
 *
 * In addition to this, widgets have event handling via on the |on| and |trigger| functionality present in
 * other adx core elements.
 *
 * Each widget on a page has a unique |cid| property.
 *
 **/
define(function (require) {
    'use strict';

    var _           = require('underscore'),
        Backbone    = require('backbone'),
        Widget;

    /**
     * Widget constructor.
     **/
    Widget = function (options) {//ignore jslint
        this.cid = _.uniqueId('widget');

        options || (options = {});//ignore jslint
        _.extend(this, _.pick(options, Widget.viewOptions));

        this._ensureElement();
        this.initialize.apply(this, arguments);
        this.delegateEvents();
    };

    Widget.delegateEventSplitter = /^(\S+)\s*(.*)$/;//ignore jslint
    Widget.viewOptions = ['el', 'id', 'attributes', 'className', 'tagName', 'events'];
    Widget.extend = Backbone.View.extend;

    _.extend(Widget.prototype, Backbone.Events, {
        tagName: 'div',

        $: function (selector) {
            return this.$el.find(selector);
        },

        initialize: function () {

        },

        render: function () {
            return this;
        },

        remove: function () {
            this.$el.remove();
            this.stopListening();

            return this;
        },

        setElement: function (element, delegate) {
            if (this.$el) {
                this.undelegateEvents();
            }

            this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
            this.el = this.$el[0];

            if (delegate !== false) {
                this.delegateEvents();
            }

            return this;
        },

        delegateEvents: function (events) {
            var key,
                method,
                match,
                eventName,
                selector;

            if (!(events || (events = _.result(this, 'events')))) {//ignore jslint
                return this;
            }

            this.undelegateEvents();

            for (key in events) {//ignore jslint
                method = events[key];

                if (!_.isFunction(method)) {
                    method = this[events[key]];
                }

                if (!method) {
                    continue;//ignore jslint
                }

                match = key.match(Widget.delegateEventSplitter);

                eventName = match[1];
                selector = match[2];

                method = _.bind(method, this);
                eventName += '.delegateEvents' + this.cid;

                if (selector === '') {
                    this.$el.on(eventName, method);
                } else {
                    this.$el.on(eventName, selector, method);
                }
            }

            return this;
        },

        undelegateEvents: function () {
            this.$el.off('.delegateEvents' + this.cid);
            return this;
        },

        _ensureElement: function () {
            var attrs,
                $el;

            if (!this.el) {
                attrs = _.extend({}, _.result(this, 'attributes'));

                if (this.id) {
                    attrs.id = _.result(this, 'id');
                }

                if (this.className) {
                    attrs['class'] = _.result(this, 'className');
                }

                $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
                this.setElement($el, false);
            } else {
                this.setElement(_.result(this, 'el'), false);
            }
        }
    });

    return Widget;
});
