/**
 * Your typical modal widget, kind of.
 *
 *
 * Basic Usage
 * -----------
 *
 *      Create the widget by invoking the constructor like so:
  ```

              var modal = new ModalWidget({
                    Icon: '...',
                    Title: '...',
                    View: myView,
                    ModalClass: '...',
                    Class: '...',
                    HideCloseButton: true | false
                    Controls: { ... } // See Common Modal Controls
               });

   ```
 *
 *      To display the modal, simply call modal.render(). The modal is automatically
 *      appended to the DOM. Once the modal is closed, it is removed from the DOM.
 *
 *
 * Class
 * --------
 * Class parameter lets you to pass in a class name and allows explicit styling like custom width.
 * 
 *
 * The View
 * --------
 *
 * The 'View' parameter is a Backbone View that you need to supply; the view's render()
 * function is invoked and the resulting html is placed into the .modal-body section.
 *
 * Common Modal Controls
 * ---------------------
 *
 * For simplicity sake, the modal can be created with a pair of confirmation buttons located
 * in the footer, where one button acts as "yes" and the other "no", although the text can be
 * changed, the styling and event names remain the same.
 *
 * The "Yes" (or Primary) label uses the Primary color style for the buttons, while the "No"
 * (or Secondary) label uses the default color style.
 *
 * To create this control, pass a Controls sub-object into the constructor. The parameters for
 * this object are:
 *
   ```

       Controls: {
            Type: 'confirm',
            LabelYes: 'Save',
            LabelNo: 'Cancel'
       }

   ```
 *
 * To listen for Yes and No events, register the modal to the following two events:
 *
 * modal.on('confirm-yes', function (modal) {...}); and
 * modal.on('confirm-no', function (modal) {...});
 *
 * For convenience, the modal control is passed in as the first parameter. Majority of the time
 * the caller wants to issue an API call and wait for a success, so the modal is not hidden right away.
 *
 * It is up to the event handler to close the modal, by calling modal.hide() on it. 
 *
 * Custom Modal Controls
 * ---------------------
 *
 * If you want to provide custom controls to the modal, expose a function from your View
 * named getModalControlsView(), which should return another Backbone View.
 *
 * When this view is rendered, it is placed into the .modal-footer section.
 *
 * Custom modal controls are handy when you want to implement more interesting behaviour,
 * such as validations, multi-step modal wizards, and the like.
 *
 **/
define(function (require) {
    'use strict';

    var View     = require('app/core/view'),
        Backbone = require('backbone'),
        Mustache = require('mustache'),
        WidgetTemplate = require('text!/Templates/ModalWidget/ModalWidget.html');

    return (function () {
        var Constructor,
            ModalModel,
            ModalView,

            CommonConfirmControlsView;

        /**
         *
         * @param {Object} opts
         **/
        Constructor = function (opts) {
            this.model = new ModalModel(opts);
            this.view = new ModalView({ model: this.model });
        };

        /** Renders the modal **/
        Constructor.prototype.render = function () {
            this.view.render();
        };

        Constructor.prototype.register = function (eventName, callback) {
            this.view.on(eventName, callback);
        };

        /** Hides the modal. **/
        Constructor.prototype.hide = function () {
            this.view.hide();
        };

        Constructor.prototype.hideControls = function () {
            this.view.hideControls();
        };

        /** Houses properties for the view. **/
        ModalModel = Backbone.Model.extend({
            defaults: {
                Title: '',
                Class: '',
                ModalClass: ''
            }
        });

        /** Backing view for the modal. **/
        ModalView = View.extend({
            className: function () {
                return 'modal fade ' + this.model.get('ModalClass');
            },

            template: WidgetTemplate,

            events: {
                'hidden.bs.modal': 'onModalHidden'
            },

            attributes: {
                "data-backdrop": "static"
            },

            initialize: function () {
                if (this.model.has('Controls')) {
                    this.initializeCommonControls();
                }
            },

            initializeCommonControls: function () {
                var commonControls = this.model.get('Controls');

                switch (commonControls.Type) {
                case 'confirm':
                    this.controlsView = new CommonConfirmControlsView({
                        modal: this,
                        LabelYes: commonControls.LabelYes,
                        LabelNo: commonControls.LabelNo
                    });
                    break;

                default:
                    throw new Error("Not Implemented");
                }
            },

            /** Removes the modal from the DOM once the hidden event is fired. **/
            onModalHidden: function () {
                this.$el.remove();
                this.trigger('modal-hidden');
            },

            toExtendedJSON: function () {
                var output;

                output = this.model.toJSON();

                return output;
            },

            render: function () {
                var html,
                    view;

                html = Mustache.render(this.template, this.model.toJSON());
                view = this.model.get('View');

                if (!this.controlsView && view.getModalControlsView) {
                    this.controlsView = view.getModalControlsView();
                }

                this.$el.html(html);

                this.$('.modal-body').append(view.render().el);

                if (this.controlsView) {
                    this.$('.modal-footer').append(this.controlsView.render().el);
                } else {
                    this.$('.modal-footer').hide();
                }

                this.$el.modal();

                return this;
            },

            /** Plays the modal hiding animation and removes it from the DOM. **/
            hide: function () {
                this.$el.modal('hide');
            },

            hideControls: function () {
                this.$('.modal-footer').hide();
            }
        });

        /**
         * Confirmation ("Yes"/"No"-type) controls view.
         *
         * Note that the actual text rendered can be customized.
         **/
        CommonConfirmControlsView = View.extend({
            template: '<button class="btn btn-default confirm-no pull-left">{{ LabelNo }}</button><button class="btn btn-primary confirm-yes">{{ LabelYes }}</button>',//ignore jslint

            events: {
                'click .confirm-yes': 'onConfirmYesClicked',
                'click .confirm-no': 'onConfirmNoClicked'
            },

            initialize: function () {
                this.modal      = this.options.modal;
                this.LabelYes   = this.options.LabelYes;
                this.LabelNo    = this.options.LabelNo;
            },

            onConfirmYesClicked: function () {
                this.modal.trigger('confirm-yes', this.modal);
            },

            onConfirmNoClicked: function () {
                this.modal.trigger('confirm-no', this.modal);
            },

            render: function () {
                var html;

                html = View.renderTemplate(this.template, {
                    LabelYes: this.LabelYes,
                    LabelNo: this.LabelNo
                });

                this.$el.html(html);

                return this;
            }
        });

        return Constructor;
    }());
});
