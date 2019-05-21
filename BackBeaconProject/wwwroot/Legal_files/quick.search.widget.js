/**
 * Cruise Id Search widget that allows an agent to search for a sailing id provided by a client.
 * @class Quick.Search.Widget
 * @module Widget
 **/
define(function (require) {
    'use strict';

    var $              = require('jquery'),
        _              = require('underscore'),
        backbone       = require('backbone'),
        mustache       = require('mustache'),
        external       = require('app/external'),
        Adx            = require('app/adx'),
        WidgetTemplate = require('text!/Templates/CruiseSearch/QuickSearchWidget.html');


    return (function () {
        var widget,
            View,
            Model;

        Model = backbone.Collection.extend({});

        View = backbone.View.extend({
            events: {
                'submit .on-quick-search-form': 'onSearch',
                'click .on-click-quick-search-id-submit': 'onSearch'
            },

            initialize: function () {
                _.bindAll(this, 'render');
                this.model = new Model();
                this.SupportedCurrencies = Adx.Common.Utilities.GetSupportedCurrencies();
                this.render();
            },

            template: WidgetTemplate,

            render: function () {
                var html = mustache.render(this.template, this.model.toJSON());
                this.$el.html(html);
            },

            /**
             * Triggers 'quick-search' event
             * @event Form Submitted
             **/
            onSearch: function (e) {
                var input,
                    self = this,
                    errorMessage = "No results found. Please try a different value.";

                e.preventDefault();
                input = this.$("#quick-search-input").val().trim();

                if (Adx.Validate.Validate(this.$('form'))) {
                    Adx.Track.Raise({
                        Event: Adx.Track.Events.Agents.QuickSearch.Request,
                        Value: {
                            SearchInput: input
                        }
                    });
                    Adx.Api.QuickSearch(input)
                        .done(function (data) {
                            if (data.Items.length === 0) {
                                Adx.Validate.CreateError($('#quick-search-input'), errorMessage);
                            } else {
                                self.determineNavigation(data.Items, input);
                            }
                        })
                        .fail(function () {
                            Adx.Validate.CreateError($('#quick-search-input'), errorMessage);
                        });
                }
            },

            determineNavigation: function (items, code) {
                var sailings,
                    quotes,
                    quoteIds = [],
                    matchedBy = [];

                quotes = $.grep(items, function (item) {
                    return item.Type.toLowerCase() === "quote";
                });
                sailings = $.grep(items, function (item) {
                    return item.Type.toLowerCase() === "sailing";
                });
                if (sailings.length > 0) {
                    this.goCruiseResult();
                } else if (quotes.length === 1) {
                    if (quotes[0].TravelServiceId) {
                        window.location.href = "/itineraries/" + quotes[0].Id
                            + "/travelService/" + quotes[0].TravelServiceId;
                    } else {
                        window.location.href = "/itineraries/" + quotes[0].Id;
                    }
                } else if (quotes.length > 1) {
                    quoteIds = _.map(quotes, function (item) {
                        return item.Id;
                    });
                    matchedBy = _.map(quotes, function (item) {
                        return item.MatchedBy;
                    });
                    window.location.href = "/quotes?quickSearchResults=true" +
                            "&quoteIds=" + quoteIds.join(',') +
                            "&matchedBy=" + matchedBy.join(',') +
                            "&code=" + code;
                }
            },

            // this uses legacy code that takes a cruise id, creates cached search criteria 
            //and returns a unique GUID identifier  in the future, this step should be omitted 
            //and the id should be passed directly to the search results page.
            // Currently, the consensus is that bypassing the step where the search criteria is 
            //stored in a CachedItems table carries too much risk.
            createGetCruiseSailingReferenceNumber: function (cruiseId, agentId, selectedCurrencyCode, callback) {
                var currentDate = new Date(),
                    fromDate,
                    self = this,
                    errorMessage = "An error occurred on a selection, "
                                   + "please try again or contact servicedesk@traveledge.com ",
                    fromDateError = "Sailings in the past cannot be searched for",
                    req = new Adx.Request({
                        Url: external.TEApiDomain + '/catalog/cruises/availabilitycriteria/',
                        Data: {
                            SailingId: cruiseId,
                            ClientId: self.clientId,
                            AgentId: agentId,
                            CurrencyCode: selectedCurrencyCode
                        },
                        Success: function (data) {
                            if (data.CruiseShipIds === null) {
                                Adx.Validate.CreateError($('#quick-search-input'), errorMessage);
                                callback({
                                    success: false,
                                    message: errorMessage,
                                    value: null
                                });
                            } else {
                                // Frank - Check if the searched sailing has passed or not
                                fromDate = data.FromDate.substring(0, 10).split("-");
                                fromDate = new Date(fromDate[0], Number(fromDate[1]) - 1, fromDate[2]);
                                if (fromDate.getTime() < currentDate.getTime()) {
                                    callback({
                                        success: false,
                                        message: fromDateError,
                                        value: null
                                    });
                                } else {
                                    callback({
                                        success: true,
                                        message: '',
                                        value: data.CriteriaToken
                                    });
                                }
                            }
                        },
                        Error: function () {
                            callback({
                                success: false,
                                message: errorMessage,
                                value: null
                            });
                        }
                    });

                req.Post();
            },
            // the trigger requests a page that accepts an alphanumeric encoded string, rather than an integer Id
            goCruiseResult: function () {
                var cruiseCode,
                    self,
                    agentReq,
                    selectedCurrency;
                self = this;
                cruiseCode = this.$('form').serializeObject().code.trim();
                agentReq = self.getAgentId();
                selectedCurrency = _.findWhere(this.SupportedCurrencies, { Code: "USD" });
                if (!selectedCurrency) {
                    selectedCurrency = this.SupportedCurrencies[0];
                }

                $.when(agentReq)
                    .done(function (agentId) {
                        self.createGetCruiseSailingReferenceNumber(cruiseCode,
                            agentId,
                            selectedCurrency.Code,
                            function (token) {
                                if (token.success) {
                                    window.location.href = "/cruisesearchresults?csc=" + token.value;
                                } else {
                                    Adx.Validate.CreateError(self.$('#quick-search-input'), token.message);
                                }
                            });
                    });
            },

            /**
            * To get the delegated Agent id
            * If it's more than one delegated Agent,then it will return the first Agent Id
            **/
            getAgentId: function () {
                var obj = new $.Deferred(),
                    delegatedAgents;

                if (window.TEAgent.Id <= 0) {
                    Adx.Api.Agent.GetDelegatedAgents(window.TEAgent.Id)
                        .done(function (agents) {
                            if (agents.length > 0) {
                                obj.resolve(agents[0].DelegateAgentId);
                            } else {
                                delegatedAgents = Adx.Common.Utilities.GetSelectedAgents();
                                obj.resolve(parseInt(delegatedAgents[0], 10));
                            }
                        });
                } else {
                    delegatedAgents = Adx.Common.Utilities.GetSelectedAgents();
                    obj.resolve(parseInt(delegatedAgents[0], 10));
                }
                return obj;
            }
        });


        /**
         * @class Quick.Search.Widget.Widget
         * @constructor
         **/
        widget = function () {
            var self = this;
            this.view = new View();
            return {
                /**
                 * Gets the DOM node for the view
                 * @method $el
                 **/
                $el: function () {
                    return self.view.$el;
                },

                /**
                 * Gets the Data from the view's model
                 * @method get
                 * @return {Object} The model's data
                 **/
                get: function () {
                    var result = {};
                    //Do this to break the backbone events on the model
                    $.extend(result, self.view.model.toJSON());
                    return result;
                },
                /**
                 * Sets the data for the view's model
                 * @method set
                 * @param {Object} data The data to update
                 **/
                set: function (data) {
                    self.view.model.set(data);
                },

                /**
                 * Forces widget to render
                 * @method render
                 **/
                render: function () {
                    self.view.render();
                },

                /**
                 * Allows an observer to register for one of the widget's events
                 * @method register
                 * @param {String} eventName event to registered callback for
                 * @param {Function} callback Callback to be executed when supplied event is triggered
                 **/
                register: function (eventName, callback) {
                    self.view.on(eventName, callback);
                },

                /**
                 * Allows an observer to trigger one of the widget's event
                 * @method trigger
                 * @param {String} event Event to be triggered
                 * @param {Object} args Arguments to be sent in
                 **/
                trigger: function (event, args) {
                    self.view['on' + event](args);
                },

                /**
                 * Set the clientId that will be passed in the criteria
                 **/
                setClientId: function (clientId) {
                    self.view.clientId = clientId;
                }
            };
        };

        widget.prototype._views = {
            view: View
        };

        widget.prototype._models = {
            viewModel: Model
        };

        return widget;
    }());
    //-- End Implementation --//
});