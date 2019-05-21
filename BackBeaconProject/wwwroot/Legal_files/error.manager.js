/**
 * Handles dealing with API errors, displaying the message and sending error logs when necessary.
 */
define(function (require) {
    'use strict';

    var $                           = require('jquery'),
        _                           = require('underscore'),
        validate                    = require('app/validate'),
        track                       = require('app/track'),
        View                        = require('app/core/view'),
        ModalWidget                 = require('app/widget/modal.widget'),
        Request                     = require('app/request'),
        SupportRequestWidget        = require('app/widget/support.request.widget'),
        Backbone                    = require('backbone'),

        ErrorNotificationTemplate   = require('text!/Templates/Errors/ErrorNotification.html'),

        ErrorManager,
        ErrorNotificationView;

    /**
     * Constructs a new Error Manager object. 
     */
    ErrorManager = function () {

    };

    /**
     * Queue of all the errors. _DO NOT MODIFY THIS DIRECTLY_.
     * 
     * Each entry is an object that contains a list of items, the notify object,
     * as well as the view that was created for this notification.
     */
    ErrorManager._errorQueue = [];

    /**
     * Page-level values which are sent within the request support. _DO NOT MODIFY THIS DIRECTLY_.
     */
    ErrorManager._pageObj = {};

    /**
     * Used as an internal failure guard in case the Error Manager runs into issues when making API calls.
     */
    ErrorManager._apiFailure = false;

    /**
     * Attempts to return an existing queue object for this error response.
     * Returns undefined if no queue entry exists.
     * 
     * @param {Object} errorResponse the API Error DTO
     */
    ErrorManager._getQueueObjectForError = function () {
        return _.first(ErrorManager._errorQueue); // Always return first error object for now.
    };

    /**
     * Displays the general support form to the user.
     */
    ErrorManager.showSupportModal = function (data) {
        var delegateReq;

        data = data || {};

        delegateReq = new Request.Request({
            Api: '/agents/' + window.TEAgent.Id + '/delegators',

            Success: function (delegatedAgents) {
                ErrorManager._createSupportModal({
                    AgentId: window.TEAgent.Id,
                    DelegatedAgents: delegatedAgents,
                    RequestId: data.RequestId,
                    HideCategories: data.HideCategories,
                    OnlyAdxSupportRequest: data.OnlyAdxSupportRequest
                });
            }
        });

        delegateReq.Get();
    };

    ErrorManager._createSupportModal = function (data) {
        var supportRequestWidget,
            modal;

        supportRequestWidget = new SupportRequestWidget(data);

        modal = new ModalWidget({
            Title: 'Request Support',
            Class: 'support-widget-modal',
            ModalClass: 'session-modal',
            Icon: 'fa fa-comment',
            View: supportRequestWidget
        });

        modal.render();

        supportRequestWidget.register('on-submit-request', function (requestDto) {
            var supportReq;

            // Append these fields to the request.
            requestDto.Url = window.location.href;
            requestDto.QuoteId = ErrorManager._pageObj.QuoteId;

            if (!requestDto.IsFromSupportWidget) {
                requestDto.IsFromSupportWidget = false;
                requestDto.TravelServiceId = ErrorManager._pageObj.TravelServiceId;
            }

            requestDto.SearchCriteria = ErrorManager._pageObj.SearchCriteriaToken;
            requestDto.RequestId = data.RequestId;

            supportReq = new Request.Request({
                Api: 'supportticket/send',

                Data: requestDto,

                Success: function (respDto) {
                    track.Raise({
                        Event: track.Events.Agents.Submit_SupportRequest_Success.SupportRequestSuccess,
                        Value: {
                            AgentId: window.TEAgent ? window.TEAgent.Id : 0
                        }
                    });

                    supportRequestWidget.set({
                        RenderSuccess: true,
                        RenderFail: false,
                        SentId: respDto.SupportTicketIdentifier
                    });
                    supportRequestWidget.render();
                },

                Error: function () {
                    track.Raise({
                        Event: track.Events.Agents.Submit_SupportRequest_Failure.SupportRequestFailure,
                        Value: {
                            AgentId: window.TEAgent ? window.TEAgent.Id : 0
                        }
                    });

                    supportRequestWidget.set({ RenderSuccess: false, RenderFail: true });
                    supportRequestWidget.render();
                }
            });

            supportReq.Post();
        });

        supportRequestWidget.register('on-close-requested', function () {
            modal.hide();
        });
    };

    /**
     * Logs the given message to local storage.
     * 
     * @param {String} message message to log
     */
    ErrorManager.logMessage = function (message, errorDto) {
        var logs;

        logs = localStorage.getItem('adx_logs');

        if (logs) {
            logs = JSON.parse(logs);
        } else {
            logs = [];
        }

        logs.push({
            Message: message,
            ErrorDto: errorDto
        });

        console.log("Message logged: ", message);

        // Later on we are going to be issuing API calls, but LocalStorage will do for now.

        localStorage.setItem('adx_logs', JSON.stringify(logs));
    };

    /**
     * Clears the logs from local storage.
     */
    ErrorManager.clearLogs = function () {
        localStorage.clear('adx_logs');
    };

    /**
     * Sets an object object that contains any data that we want captured
     * for that specific page.
     * 
     * @param {} obj
     * @returns {} 
     */
    ErrorManager.setPageSpecificData = function (obj) {
        ErrorManager._pageObj = obj;
    };

    ErrorManager.getPageSpecificData = function () {
        return ErrorManager._pageObj;
    };

    /**
     * Appends an error to the error queue, and if needed, displays the error overlay.
     * 
     * @param {} errorResponse 
     * @returns {} 
     */
    ErrorManager.appendError = function (statusCode, errorResponse, renderOpts) {
        var queueObject,
            errors,
            notificationView,
            modal,
            isWarning,
            type,
            self,
            delegateReq,
            warningStatusCodes;

        // When user browsers elsewhere while an API call is under way.
        if (statusCode === 0) {
            return;
        }

        renderOpts = renderOpts || {};

        self = this;

        // In the strange case that we get no error response back, fill in a default one.
        // Note that we won't have a token or anything like that.
        errorResponse = errorResponse || {
            UserDisplayTitle: 'Important Information',
            UserDisplayMessage: 'An error has occurred. Please use the form below to contact ADX technical support.'
        };

        queueObject = ErrorManager._getQueueObjectForError(errorResponse);

        warningStatusCodes = [401, 400, 409];

        isWarning = _.contains(warningStatusCodes, statusCode);

        // Create a new queue object if it has not been found.
        if (!queueObject) {
            delegateReq = new Request.Request({
                Api: '/agents/' + window.TEAgent.Id + '/delegators',

                Success: function (delegatedAgents) {
                    var existingObject;

                    errors = [errorResponse];

                    if (isWarning) {
                        type = errorResponse.ErrorType === "Informational" ? 'info' : 'warning';
                    } else {
                        type = errorResponse.ErrorType === "Informational" ? 'info' : 'error';
                    }

                    if (type === 'info') {
                        $('.te-page-notification-widget').remove();
                    }

                    notificationView = new ErrorNotificationView({
                        type: type,
                        errors: errors,
                        agent: {
                            AgentId: window.TEAgent.Id,
                            DelegatedAgents: delegatedAgents
                        }
                    });

                    modal = new ModalWidget({
                        Title: errorResponse.UserDisplayTitle || type,
                        Icon: isWarning ? 'fa fa-info-circle' : 'fa fa-exclamation-circle',
                        Class: 'error-notification-modal ' + type,
                        HideCloseButton: renderOpts.HideCloseButton,
                        View: notificationView
                    });

                    queueObject = {
                        ErrorMessage: errorResponse.UserDisplayMessage,
                        View: notificationView,
                        Errors: errors,
                        Modal: modal
                    };

                    notificationView.on('notification-closed', function () {
                        modal.hide();
                    });

                    notificationView.on('notification:continue', function () {
                        modal.hide();
                        self.trigger('errormananger:continue');
                    });

                    modal.view.on('modal-hidden', function () {
                        ErrorManager._errorQueue = [];
                    }, self);

                    notificationView.on('send-request', function () {
                        var data,
                            formData,
                            req;

                        formData = notificationView.getFormData();

                        data = {
                            OnBehalfOfAgentId: formData.OnBehalfOfAgentId || notificationView.agent.AgentId,
                            IssueDescription: formData.IssueDescription,
                            IsUrgent: !!formData.IsUrgent,
                            CCEmail: formData.CCEmail,
                            RequestId: queueObject.Errors[0].RequestId,
                            Url: window.location.href,
                            QuoteId: ErrorManager._pageObj.QuoteId,
                            TravelServiceId: ErrorManager._pageObj.TravelServiceId,
                            SearchCriteria: ErrorManager._pageObj.SearchCriteriaToken
                        };

                        req = new Request.Request({
                            Api: 'supportticket/send',
                            Data: data,
                            Success: function (respDto) {
                                notificationView.setSentId(respDto.SupportTicketIdentifier);
                            }
                        });

                        req.Post();
                    }, self);

                    existingObject = ErrorManager._getQueueObjectForError(errorResponse);

                    if (!existingObject) {
                        ErrorManager._errorQueue.push(queueObject);
                        modal.render();
                    } else {
                        existingObject.Errors.push(errorResponse);
                        existingObject.View.render();
                    }
                },

                Error: function () {
                    //
                    // If this issue happens then there's no recovery plan - prevent this call from occuring again.
                    //

                    ErrorManager._apiFailure = true;
                }
            });

            if (!ErrorManager._apiFailure) {
                delegateReq.Get();
            }
        } else {
            queueObject.Errors.push(errorResponse);
            queueObject.View.render();
        }

        if (errorResponse.StackTrace) {
            console.log('%c Stack Trace:', 'font-weight:bold;', errorResponse.StackTrace);
        }

        if (errorResponse.DeveloperMessage) {
            console.log('%c Developer Message: ', 'font-weight:bold;', errorResponse.DeveloperMessage);
        }
    };

    /**
     * Removes all errors from the queue and hides the error overlay.
     */
    ErrorManager.clearErrors = function () {
        ErrorManager._errorQueue = [];
    };

    ErrorManager.register = function (eventName, callback) {
        this.view.on(eventName, callback);
    };

    /**
     * View responsible for rendering out the error messages.
     */
    ErrorNotificationView = View.extend({
        template: ErrorNotificationTemplate,

        events: {
            'click .btn-show-support-form': 'onShowSupportFormClicked',
            'click .btn-close-support-form': 'onCloseSupportFormClicked',
            'click .btn-continue': 'onContinueClicked',
            'click .btn-cancel-support': 'onCancelSupportClicked',
            'click .btn-send-request': 'onSendRequestClicked',
            'click .change-receiver': 'onChangeReceiverClicked'
        },

        initialize: function () {
            this.type = this.options.type;
            this.errors = this.options.errors;
            this.agent = this.options.agent;
            this.showSupportForm = (this.type === 'error');
            this.sent = false;
        },

        setSentId: function (sentId) {
            this.sentId = sentId;
            this.render();
        },

        onShowSupportFormClicked: function (e) {
            e.preventDefault();
            this.showSupportForm = !this.showSupportForm;
            this.render();
        },

        onContinueClicked: function (e) {
            e.preventDefault();
            this.trigger('notification:continue');
        },

        onCloseSupportFormClicked: function (e) {
            e.preventDefault();
            this.trigger('notification-closed');
        },

        onCancelSupportClicked: function (e) {
            e.preventDefault();
            this.showSupportForm = false;
            this.render();
        },

        onSendRequestClicked: function (e) {
            var $form;

            e.preventDefault();

            $form = this.$('form');

            validate.ClearAll($form);
            if (!validate.Validate($form)) {
                return;
            }

            this.$('.btn-send-request').attr('disabled', 'disabled')
                .addClass('btn-throbber');

            this.trigger('send-request');
        },

        onChangeReceiverClicked: function (e) {
            e.preventDefault();

            this.$('.change-receiver-block').hide();
            this.$('.receiver-block').show();
        },

        getFormData: function () {
            var obj;

            obj = this.$('form').serializeObject();

            return obj;
        },

        getViewModel: function () {
            var output = this.errors[0];

            output.Type = this.type;
            output.SentId = this.sentId;
            output.TotalErrorCount = this.errors.length;
            output.ShowSupportForm = this.showSupportForm && output.IsSupportRequestEnabled;
            output.Agent = this.agent;
            output.ShowDevMessage = !!output.DeveloperErrorMessage;
            output.Continue = this.type === 'info';
            output.ForceClose = this.type === 'error';

            return output;
        },

        render: function () {
            var data;

            data = this.getViewModel();

            this.$el.html(View.renderTemplate(this.template, data));

            return this;
        }
    });

    /**
     * Implements the Uncaught Exception error handler for the browser.
     * All uncaught exceptions will be sent and logged in the back-end through this method.
     * 
     * @param {} message 
     * @param {} filename 
     * @param {} lineno 
     * @param {} colno 
     * @param {} error 
     * @returns {} 
     */
    window.onerror = function (message, filename, lineno, colno, error) {//ignore jslint
        var req,
            msgReq,
            errorDto,
            stackTraceEntries;

        errorDto = {
            Filename: filename,
            LineNumber: lineno,
            Column: colno,
            Message: error.message,
            StackTrace: error.stack
        };

        // Determine whether the origin of error was through the error manager;
        // if so, we don't want it to continously keep erroring on itself.

        if (errorDto.StackTrace) {
            stackTraceEntries = errorDto.StackTrace.split('\n');

            if (_.find(stackTraceEntries, function (entry) {
                    return entry.indexOf('error.manager') !== -1;
                })) {
                return;
            }
        }

        ErrorManager.logMessage(message, errorDto);

        req = new Request.Request({
            Url: '/logging/log-error',

            Data: errorDto,

            Success: function () {
                // Display generic error here.
            },

            Error: function () {
                // Deal with this.. silently drop it? write it to Local Storage?
            }
        });

        req.Post();

        msgReq = new Request.Request({
            Api: 'errors/raise?type=JsTravelEdgeException',

            Success: function () {

            },

            Error: function () {

            }
        });

        msgReq.Get();
    };

    _.extend(ErrorManager, Backbone.Events);

    return ErrorManager;
});
