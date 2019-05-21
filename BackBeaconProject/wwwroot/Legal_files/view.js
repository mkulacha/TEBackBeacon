/**
 * Base view for all views within Adx.
 *
 * Provides common functionality that most views require.
 **/
define(function (require) {
    'use strict';

    var Mustache = require('mustache'),
        Backbone = require('backbone'),
        View;

    View = Backbone.View.extend({

    });

    /**
     * Renders the |tmpl|, passing in the |obj| to the rendering context, and returns the HTML output.
     *
     * @return {String} the rendered template
     **/
    View.renderTemplate = function (tmpl, obj) {
        return Mustache.render(tmpl, obj);
    };

    /**
     * Compiles the |tmpl|, allowing it to be rendered at a later date.
     **/
    View.compileTemplate = function (tmpl) {
        return Mustache.compile(tmpl);
    };

    return View;
});
