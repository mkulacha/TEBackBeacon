/**
 * Displays the Support Request form, allowing an agent to submit a ticket to our wonderful support team.
 *
 * @class Support.Widget
 * @module Widget
 **/
define(function (require) {
    'use strict';

    var $           = require('jquery'),
        backbone    = require('backbone'),
        track       = require('app/track'),
        Mustache    = require('mustache'),
        Enums       = require('app/enumtypes'),
        validate    = require('app/validate'),
        WidgetTemplate = require('text!/Templates/SupportRequestWidget/Widget.html');

    return (function () {
        var SupportRequestPageWidget,
            SupportRequestPageView,
            SupportRequestPageModel;

        /**
         * Sets referring URL.
         * Initializes model and view.
         * @class Support.Widget
         * @constructor (SupportRequestPageWidget)
         **/
        SupportRequestPageWidget = function (data) {
            var self, referrer;
            referrer = document.referrer;
            self = this;
            self._model = new SupportRequestPageModel({Data: data, Referrer: referrer, RenderSuccess: false});
            self._view = new SupportRequestPageView({ model: this._model });
        };

        /**
        * Renders the widget.
        * @method render (SupportRequestPageWidget)
        **/
        SupportRequestPageWidget.prototype.render = function () {
            return this._view.render();
        };

        /**
         * Allows an observer to register for one of the widget's events
         *
         * @method register (SupportRequestPageWidget)
         * @param {String} eventName event to registered callback for
         * @param {Function} callback Callback to be executed when supplied event is triggered
         **/
        SupportRequestPageWidget.prototype.register = function (eventName, callBack) {
            this._view.on(eventName, callBack);
        };

        /**
        * Called after widget finishes rendering
        * Renders the category select.
        * @method register (SupportRequestPageWidget)
        **/
        SupportRequestPageWidget.prototype.postRender = function () {
            this._view.renderCategories();
        };

        /**
        * Called on successful API POST attempt.
        * Hides the main form.
        * @method register (SupportRequestPageWidget)
        **/
        SupportRequestPageWidget.prototype.onPostDone = function () {
            this._view.hideMain();
        };

        /**
         * Sets the data for the view's model
         *
         * @method set (SupportRequestPageWidget)
         * @param {Object} data The data to update
         **/
        SupportRequestPageWidget.prototype.set = function (data) {
            this._view.model.set(data);
        };

        /**
         * Default values for the widget constructor
         *
         * ```javascript
         * defaults: {
         * }
         * ```
         * @property Widget Defaults
         * @type JSON
         **/
        SupportRequestPageModel = backbone.Model.extend({ });

        SupportRequestPageView = backbone.View.extend({

            /**
            * Contains event selectors and their callback handlers for the view
            * 
            * @property events (SupportRequestPageView)
            * @type {Object}
            */
            events: {
                'click .submit-request-btn': 'prepareDTO',
                'click .back-link': 'cancelAndBack',
                'click #urgentCheckbox': 'urgentCheck',
                'click .close-request-modal-btn': 'onCloseClicked',
                'change .ticket-category-select' : 'fillTextarea'
            },

            /**
             * Does nothing.
             * @method initialize (SupportRequestPageView)
             **/
            initialize: function () {

            },

            /**
             * Loads and stores the template for the view
             * @type {Object}
             */
            template: WidgetTemplate,

            /**
             * Renders the View template,
             * and updates this.$el with the new HTML.
             *
             * @method render (SupportRequestPageView)
             * @return {Object} Returns the view
             **/
            render: function () {
                var html = Mustache.render(this.template, this.model.toJSON());

                this.$el.html(html);
                this.setPreviousPage();

                return this;
            },

            /**
            * Populates the category select.
            * @method renderCategories (SupportRequestPageView)
            **/
            renderCategories: function () {
                var self = this, data = this.model.get('Data');
                $.each(data.category, function (key, value) {
                    self.$('#supportCategory').append('<option value="' + key + '">' + value.sCategory + '</option>');
                });
            },

            /**
            * Sets the return anchor to the previous page.
            * @method setPreviousPage (SupportRequestPageView)
            **/
            setPreviousPage: function () {
                var url = this.model.get('Referrer');
                this.$('.back-link').attr('href', url);
            },

            setText: function (val) {
                this.$('.request-text').val(val);
            },

            /**
            * Pre-fills the textarea with stuff associated
            * with the category.
            * @method fillTextarea (SupportRequestPageView)
            **/
            fillTextarea: function () {
                var categoryName = this.$('.ticket-category-select').val();

                switch (categoryName) {
                case 'aDX - Account Inquiries':
                    this.fillTextAccountInquiry();
                    break;

                case 'Cruise - Promotional Help':
                    this.fillTextCruisePromotionHelp();
                    break;

                case 'Cruise - Help Booking':
                    this.fillTextCruiseHelpBooking();
                    break;

                case 'Cruise - Change or Cancel Booking':
                    this.fillTextChangeCancelBooking();
                    break;

                case 'Air - Help Booking':
                    this.fillTextAirHelpBooking();
                    break;

                case 'Air - Commission and Contract Help':
                    this.fillTextAirCommissionContractHelp();
                    break;
                }
            },

            fillTextAccountInquiry: function () {
                this.setText('Tell us your inquiry: ');
            },

            fillTextCruisePromotionHelp: function () {
                this.setText('What can we help you with: ');
            },

            fillTextCruiseHelpBooking: function () {
                this.setText('Booking Reference (if applicable): \n\nWhat can we help you with: ');
            },

            fillTextChangeCancelBooking: function () {
                this.setText('Cruise Booking Reference: ' +
                        '\naDX Ref #: \nTraveler Names: \nCruise Line: \n');
            },

            fillTextAirHelpBooking: function () {
                this.setText('aDX Ref # (if applicable): \n\nWhat can we help you with: ');
            },

            fillTextAirCommissionContractHelp: function () {
                this.setText('PNR and GDS Record Locator: \n\nWhat can we help you with: ');
            },

            /**
            * Serialize the main form and sends it to
            * the page to be POST'ed.
            * Triggers 'on-submit-request'.
            * @method prepareDTO (SupportRequestPageView)
            **/
            prepareDTO: function () {
                var dto,
                    validationFlag = true;
                if (!validate.Validate(this.$('form'))) {
                    validationFlag = false;
                }
                if (!this.$('[name="requestType"]:checked').length) {
                    validationFlag = false;
                    validate.CreateError(this.$('.requestType'),
                            'Please select support request type.');
                }
                if (!validationFlag) {
                    return;
                }

                this.$('.submit-request-btn').addClass('disabled btn-throbber');
                dto = this.$('form').serializeObject();

                dto.IsUrgent = parseInt(dto.IsUrgent, 10);
                dto.HelpSpotDestination = Enums.HelpSpotDestinationTypes.HelpSpot;
                dto.IsFromSupportWidget = true;
                if ($('input[name="requestType"]:checked').val() === 'airTeam') {
                    dto.SupportSubCategoryId = Enums.SupportTicketSubCategoryType.GeneralQuestion;
                }
                this.trigger('on-submit-request', dto);
            },

            /**
             * Redirect the agents to where they from
             * @method cancelAndBack (SupportRequestPageView)
             **/
            cancelAndBack: function (e) {
                e.preventDefault();
                track.Raise({
                    Link: $(e.currentTarget).attr('href'),
                    Event: track.Events.Agents.Click_CancelAndBackToAdx.CancelAndBackToAdx,
                    Value: {
                        AgentId: window.TEAgent ? window.TEAgent.Id : 0
                    }
                });
                return false;
            },

            /**
             * Indicate the agent has specified this request to be urgent
             * @method urgentCheck (SupportRequestPageView)
             **/
            urgentCheck: function () {
                if ($('#urgentCheckbox').prop('checked')) {
                    track.Raise({
                        Event: track.Events.Agents.Click_RequestUrgentChecked.RequestUrgentChecked,
                        Value: {
                            AgentId: window.TEAgent ? window.TEAgent.Id : 0
                        }
                    });
                } else {
                    track.Raise({
                        Event: track.Events.Agents.Click_RequestUrgentUnchecked.RequestUrgentUnchecked,
                        Value: {
                            AgentId: window.TEAgent ? window.TEAgent.Id : 0
                        }
                    });
                }
            },

            /**
             * Hides the main form.
             * @method hideMain (SupportRequestPageView)
             **/
            hideMain: function () {
                this.$('.main-wrapper').addClass('hide');
            },

            onCloseClicked: function () {
                this.trigger('on-close-requested');
            }

        });
        return SupportRequestPageWidget;
    }());
});
