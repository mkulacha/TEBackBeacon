/**
 * This is the applicaiton module which is required for all pages
 *
 * @class Request
 * @module Framework
 **/
define(function (require, exports) {
    'use strict';

    var $               = require('jquery'),
        _               = require('underscore'),
        LoginWidget     = require('app/widget/login.widget'),
        external        = require('app/external'),
        errorManager    = require('app/error.manager'),

        LoginView       = require('app/views/login.view'),
        ModalWidget     = require('app/widget/modal.widget'),

        RequestClass,
        resolveRequest;

    RequestClass = function (options) {
        var defaults = {
            Api: '',
            Url: '',
            FormToValidate: null,
            Data: {},
            ItemId: -1,
            ContentType: 'application/json',
            Async: true,
            IsCors: false,
            /*Success: function (results) { }, //ignore jslint
            Error: function (jqXHR, status, error) { //ignore jslint
                notify.Create.Error(error);
            },*/
            Complete: function () { } //ignore jslint
        };

        this.Options = $.extend(defaults, options);
        this.Result = {};
    };

    /**
     * Keeps track of outstanding requests that have to be processed once the user
     * has been authorized.
     *
     * @static
     * @private
     **/
    RequestClass._requestQueue = [];

    /**
     * Displayed when an API call returns a 401 and we need to authorize.
     *
     * @static
     * @private
     **/
    RequestClass._loginWidget = new LoginWidget();

    /**
     * Deprecated. This method is due for extermination.
     * 
     * @private
     **/
    RequestClass.promptLogin = function () {
        RequestClass._loginWidget.render();

        RequestClass._loginWidget.register('on-login-successful', function () {
            RequestClass.processQueue();
        });
    };

    /**
     * Displays the login form within a modal; used for re-authentication.
     */
    RequestClass.promptModalLogin = function () {
        var modal;

        if (!RequestClass.loginView) {
            RequestClass.loginView = new LoginView();

            modal = new ModalWidget({
                Class: 'session-login',
                ModalClass: 'session-modal',
                Icon: 'fa fa-lock',
                Title: 'Please Sign In to Continue',
                View: RequestClass.loginView
            });

            RequestClass.loginView.on('on-login-successful', function () {
                modal.hide();
                RequestClass.loginView = null;
                RequestClass.processQueue();
            });

            modal.render();
        }
    };

    /**
     * Returns true if the modal is being displayed for the user.
     *
     * @private
     **/
    RequestClass.isLoginPending = function () {
        return RequestClass._loginWidget.isActive();
    };

    /**
     * Add an API request to be processed once the user is logged in.
     **/
    RequestClass.queueRequest = function (req) {
        RequestClass._requestQueue.push(req);
    };

    /**
     * Removes all pending requests.
     **/
    RequestClass.clearRequests = function () {
        RequestClass._requestQueue = [];
    };

    /**
     * Processes all the pending requests and clears the request queue.
     **/
    RequestClass.processQueue = function () {
        var i;

        for (i = 0; i < RequestClass._requestQueue.length; i++) {
            RequestClass._requestQueue[i].RetryLast();
        }

        RequestClass.clearRequests();
    };

    /**
     * Sign the agent out.
     *
     * @param {Object} successCallback  called when agent is signed out.
     **/
    RequestClass.signOut = function (successCallback) {
        var req = new RequestClass({
            Url: external.TEApiDomain + '/auth',
            Success: successCallback
        });

        req.Delete();
    };

    /**
     * Handle error responses to API requests
     * 
     * @param {Object} jqXHR   jQuery superset of the XMLHTTPRequest object
     * @param {Object} respJson   the data from the repsonse body as JSON
     * @param {Object} reqObj   an AJAX request object
     **/
    RequestClass.handleResponseError = function (jqXHR, respJson, reqObj, req, renderOpts) { //ignore jslint
        errorManager.appendError(jqXHR.status, respJson, renderOpts);
    };

    RequestClass.prototype.Get = function () { return resolveRequest(this, 'GET'); };
    RequestClass.prototype.Put = function () { return resolveRequest(this, 'PUT'); };
    RequestClass.prototype.Post = function () { return resolveRequest(this, 'POST'); };
    RequestClass.prototype.Patch = function () { return resolveRequest(this, 'PATCH'); };
    RequestClass.prototype.Delete = function () { return resolveRequest(this, 'DELETE'); };
    RequestClass.prototype.RetryLast = function () { return resolveRequest(this, this.method); };

    resolveRequest = function (req, method) {
        var reqOptionsUrl, opts;
        reqOptionsUrl = req.Options.Url || '';
        req.method = method;

        if (RequestClass.isLoginPending()) {
            RequestClass.queueRequest(req);
            return;
        }

        if (req.Options.Url === '') {
            reqOptionsUrl = (req.Options.Api.indexOf('/api/') === -1 ? '/api/' : '') + req.Options.Api;

            if (req.Options.ItemId !== -1) {
                reqOptionsUrl += '/' + req.Options.ItemId;
            } else if (req.Options.Data.id !== undefined) {
                reqOptionsUrl += '/' + req.Options.Data.id;
            }
        }

        opts = {
            method: method,
            url: reqOptionsUrl,
            data: (method === 'GET' ? $.param(req.Options.Data) : JSON.stringify(req.Options.Data)),
            async: req.Options.Async
        };

        //
        // IE8 and Firefox have specific requirements around CORS, and which fields
        // can be present (regardless of value) in the AJAX request. We selectively
        // append the fields if matching criteria.
        //

        if (req.Options.ContentType !== null) {
            opts.contentType = req.Options.ContentType;
        }

        if (req.Options.IsCors) {
            opts.xhrFields = {
                withCredentials: false
            };
        }

        if (req.Options.Success) {
            opts.success = function (data, status, jqXhr) {
                req.Result = data;
                req.Options.Success(req.Result, status, jqXhr);
            };
        }

        opts.error = function (jqXHR, status, error) {//ignore jslint
            var respJson,
                options;

            options = {};

            if (jqXHR.status === 401 && reqOptionsUrl.indexOf('/auth') === -1) {
                RequestClass.queueRequest(req);
                RequestClass.promptModalLogin();
                return;
            }

            respJson = {};

            if (_.isString(jqXHR.responseText) && (jqXHR.responseText.length > 0)) {
                try {
                    respJson = JSON.parse(jqXHR.responseText);
                } catch (e) {
                    errorManager.appendError(500, {
                        UserDisplayMessage: 'An error occured.',
                        DeveloperMessage: 'Unable to Parse Response'
                    });
                }
            }

            if (respJson.ErrorType === "Informational") {
                RequestClass.handleResponseError(jqXHR, respJson, this, req, { HideCloseButton: true });
                errorManager.once('errormananger:continue', function () {
                    req.Options.Success(respJson.Body, jqXHR, jqXHR.status);
                });
                return;
            }

            if (req.Options.Error) {
                req.Options.Error(jqXHR, jqXHR.status, error, options, respJson, errorManager);
            }

            if (!options.silent) {
                RequestClass.handleResponseError(jqXHR, respJson, this, req); // status, error, 
            }
        };

        if (req.Options.Complete) {
            opts.complete = function () {
                req.Options.Complete();
            };
        }
        return $.ajax(opts);
    };

    exports.Request = RequestClass;

    return RequestClass;
});
