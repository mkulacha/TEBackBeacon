/**
 * Login widget that prompts the user to login.
 * It will take on its T&C form if the user has not yet
 * accepted the T&C. It will send API calls to authenticate
 * the user as well as update the user's T&C acceptance status.
 * @class Login.Widget
 * @module Widget
 **/
/*jslint indent: 4, maxerr: 50, vars: true, regexp: true, sloppy: true */
define(function (require, exports) { //ignore jslint
    'use strict';

    //-- Start Require --//
    var $               = require('jquery'),
        Backbone        = require('backbone'),
        external        = require('app/external'),
        Request         = require('app/request'),
        track           = require('app/track'),
        validate        = require('app/validate'),
        common          = require('app/common');

    require('bootstrap');

    return (function () {
        var LoginWidget,
            LoginModel,
            LoginView;

        /**
         * @class Login.Widget
         * @constructor
         **/
        LoginWidget = function () {
            this.loginModel = new LoginModel();
            this.loginView = new LoginView({ model: this.loginModel, widget: this });
        };

        /**
         * Render the widget as a modal overlay.
         *
         * @method
         **/
        LoginWidget.prototype.render = function () {
            return this.loginView.render().el;
        };

        /**
         * Checks if the modal is active.
         *
         * @method
         **/
        LoginWidget.prototype.isActive = function () { //ignore jslint
            return false;
        };

        /**
         * Hides the login widget. This should be called when
         * the user is successfully authenticated.
         *
         * @method
         **/
        LoginWidget.prototype.hide = function () {
            this.loginView.hide();
        };

        /**
         * Event handler registration.
         *
         * @method
         * @public
         **/
        LoginWidget.prototype.register = function (eventName, callback) {
            this.loginView.on(eventName, callback);
        };

        LoginModel = Backbone.Model.extend({
            defaults: {
                firstName: null,
                lastName: null,
                TCAccepted: false
            }
        });

        /**
         * The modal and the 
         *
         * @private
         **/
        LoginView = Backbone.View.extend({
            model: LoginModel,

            /**
            * Contains event selectors and their callback handlers for the view.
            * 
            * @property events (View)
            * @type {Object}
            */
            events: {
                'click .btn-login': 'onTryLogin',
                'click .on-click-remember-me': 'onClickRememberMe',
                'click .btn-continue': 'onTcContinue',
                'click .btn-forgot-password': 'onForgotPassword',
                'click .forgot-password-link': 'onForgotPasswordLink',
                'click .read-terms-and-conditions-link': 'onReadTermsAndConditions',
                'keyup #password1': 'onTypePassword',
                'keyup #password2': 'onTypePassword',
                'click #change-password-button': 'onChangePassword',
                'click .reset-back-link': 'onBackToLogin',
                'click .terms-and-conditions-back-link': 'onTermsAndConditionsBackToLogin',
                'focus #username': 'onFocusUsername',
                'focus #password': 'onFocusPassword'
            },

            initialize: function () {
                this.widget = this.options.widget;
            },

            onFocusUsername: function () {
                validate.ClearError(this.$('#username'));
            },

            onFocusPassword: function () {
                validate.Validate(this.$el.find('#login-form'), 'login');
                validate.ClearError(this.$('#password'));
            },

            onClickRememberMe: function (e) {
                var $e;
                $e = $(e.currentTarget);
                track.Raise({
                    Event: track.Events.Agents.Login.RememberMe,
                    Value: {
                        Remembered: $e.prop('checked')
                    }
                });
            },

            /**
            * Triggers 'on-login-successful' event.
            * Triggered by a successful user login attempt.
            *
            * @event On Login Successful
            **/
            /**
             * Called when the user clicks on the Login button.
             * First send POST /auth to the API along with the
             * user's credentials to be authenticated.
             * If authortized, backend returns DTO with user's 
             * TC acceptance status. Transforms into TC form 
             * if not already accepted and allows user to accept
             * the TC. Finally redirects user to their dashboard
             * if all goes well.
             *
             * @method onTryLogin (View)
             **/
            onTryLogin: function (e) {
                var request,
                    data,
                    _this;

                e.preventDefault();

                if (!validate.Validate($('#login-form'), 'login')) {
                    return;
                }

                _this = this;
                data = this.$('#login-form').serializeObject();

                // Save email for tracking purposes.
                this.Email = data.username;

                this.$('.btn-login').text('Signing in...').addClass('btn-throbber disable').
                    prop('disabled', true);
                this.$('.alert').hide();
                //Authorization Call
                request = new Request.Request({
                    Url: external.TEApiDomain + '/auth',
                    Data: data,
                    Success: function (tcAcceptedDto) {
                        //If user is authorized, back-end will return a HttpResponseMessage
                        //with Success code, with Body that has DTO accepted = true or false
                        //indicating rather user has already accepted TC or not.

                        //On success, call TC check function.
                        //Grab the TC status from their body.
                        var content, alreadyAccepted;
                        content = JSON.parse(tcAcceptedDto);
                        alreadyAccepted = content.Body.TCAccepted;
                        _this.model.set(content.Body); //Stick name into the model.
                        _this.renderGreeting(); //Re-render the greeting message.

                        //Clear Selected Agents Cookie as no selections were made yet
                        common.Common.Utilities.SetCookie('SelectedAgents', '', -1);
                        if (!alreadyAccepted) {
                            _this.$('.default-view').addClass('hide');
                            _this.$('.login-modal-dialog').css('width', '600px');
                            _this.$('.tc-view').removeClass('hide');
                            // _this.$('.login-adx-logo').css('margin-left', '0px');
                        } else {
                            _this.trigger('on-login-successful');
                            _this.$el.modal('hide');
                            _this.redirectToDashboard(tcAcceptedDto, _this.Email);
                        }
                    },
                    Error: function (jqXHR, status, error, options) {//ignore jslint
                        var respData;

                        options.silent = true;

                        respData = $.parseJSON(jqXHR.responseText);
                        //ErrorID
                        _this.$('.bad-cred-alert').text(respData.UserDisplayMessage
                            + " (Ref : " + respData.ErrorMessageId + ")");

                        _this.$('.bad-cred-alert').removeClass('hide');
                        _this.$('.bad-cred-alert').show();
                    },
                    Complete: function () {
                        _this.$('.btn-login').text('Login').removeClass('btn-throbber disable').
                            prop('disabled', false);
                    }
                });
                request.Post();
            },

            /**
            * Triggers 'on-login-successful' event.
            * Triggered by a user accepting the TC.
            *
            * @event On Login Successful
            **/
            /**
             * This is the Continue button from the TC view.
             * It won't show up unless they have not already accepted the TC.
             *
             * @method onTcContinue (View)
             **/
            onTcContinue: function (e) {
                var request,
                    _this;

                e.preventDefault();

                _this = this;
                if (!(_this.$('#accept-checkbox').prop('checked'))) {
                    _this.$('.tc-accept-alert').removeClass('hide');
                    _this.$('.tc-accept-alert').show();
                } else {
                    //Else they checked the accepted box. This is good.
                    //Send API call POST api/users/AcceptTaC to the back to update
                    //their table.
                    request = new Request.Request({
                        Api: 'users/AcceptTaC',
                        Success: function () {
                            //Done. Progress as usual.
                            var model = _this.model;
                            _this.trigger('on-login-successful');
                            _this.$el.modal('hide');

                            // Frank - redirect the user to dashboard
                            track.Raise({
                                Event: track.Events.Agents.Login.Login,
                                Link: '/dashboard',
                                Value: {
                                    FirstName: model.get("firstName"),
                                    LastName: model.get("lastName"),
                                    Email: _this.Email
                                }
                            });
                        }
                    });
                    request.Post();
                }
            },

            /**
            * Frank - link to the terms & conditions view
            *
            * @method onReadTermsAndConditions (View)
            **/
            onReadTermsAndConditions: function (e) {
                e.preventDefault();
                this.$('.login-view').addClass('hide');

                this.$('.default-view').addClass('hide');
                this.$('.login-modal-dialog').css('width', '600px');
                this.$('.tc-view').removeClass('hide');
                this.$('.login-accept-choice').addClass('hide');
                this.$('.login-continue-section').addClass('hide');
            },

            onTermsAndConditionsBackToLogin: function (e) {
                e.preventDefault();
                this.$('.login-view').removeClass('hide');

                this.$('.default-view').removeClass('hide');
                this.$('.login-modal-dialog').css('width', '370px');
                this.$('.tc-view').addClass('hide');
                this.$('.login-accept-choice').removeClass('hide');
                this.$('.login-continue-section').removeClass('hide');
            },

            /**
            * This is the Forgot Password button from the Forgot Password view.
            * It won't show up unless they are on the Forgot Password view.
            *
            * @method onForgotPassword (View)
            **/
            onForgotPassword: function (e) {
                var request,
                    _this;

                e.preventDefault();

                if (!validate.Validate('#login-form', 'login')) {
                    return;
                }
                _this = this;
                this.$('.btn-forgot-password').text('Sending Reset...').addClass('btn-throbber disable').
                    prop('disabled', true);
                this.$('.alert').hide();

                request = new Request.Request({
                    Api: 'users/resetpassword',
                    Data: { Email: $('#email-address').val() },
                    Success: function () {
                        $('.form-content').addClass('hide');
                        _this.$('.login-modal-dialog').css('width', '405px');
                        $('#success-message').removeClass('hide');
                    },
                    Error: function (jqXHR, status, error, options, respJson) {//ignore jslint
                        options.silent = true;

                        if (respJson) {
                            _this.$('.forgot-password').text(respJson.UserDisplayMessage
                                + " (Ref : " + respJson.ErrorMessageId + ")");
                        }

                        _this.$('.forgot-password').removeClass('hide');
                        _this.$('.forgot-password').show();
                    },
                    Complete: function () {
                        //This is just aesthetics.
                        _this.$('.btn-forgot-password').text('Submit').removeClass('btn-throbber disable').
                            prop('disabled', false);
                    }
                });
                request.Post();
                return false;
            },

            onForgotPasswordLink: function (e) {
                e.preventDefault();
                var _this = this;
                _this.$('.login-view').addClass('hide');
                //_this.$('.default-view').addClass('hide');
                _this.$('.forgot-password-view').removeClass('hide');
            },

            onBackToLogin: function (e) {
                e.preventDefault();
                this.$('.forgot-password-view, .tc-view').addClass('hide');
                this.$('.login-view, .default-view').removeClass('hide');
            },

            /**
            This is the Change Password Method,that will call the API to reset the password
            **/
            onChangePassword: function () {
                var token = window.location.href.substr((window.location.href.indexOf('=') + 1),
                    window.location.href.length), req, _this;

                $('#change-password-button').addClass('btn-throbber disable').
                    prop('disabled', true);

                _this = this;
                req = new Request.Request({
                    Api: 'users/password',
                    Data: {
                        Token: token,
                        NewPassword: $('#password1').val()
                    },
                    Success: function (tcAcceptedDto) {
                        _this.validateTandC(tcAcceptedDto, _this);
                    },
                    Error: function () {
                        _this.$('.re-type-password').removeClass('hide');
                        _this.$('.re-type-password').show();
                    },
                    Complete: function () {
                        _this.$('#change-password-button').removeClass('btn-throbber disable').
                            prop('disabled', false);
                    }
                });
                req.Put();

                return false;

            },

            /**
            Frank - Validate and render the reset password page
            */
            onTypePassword: function () {
                var passwordMessage1 = $('#password-1-message'),
                    passwordMessage2 = $('#password-2-message'),
                    passwordMatch = $('#password1').val() === $('#password2').val(),
                    passwordRule = $('#password1').val().match(/^.*(?=.{7,50})(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/);


                $('#change-password-button').attr('disabled', true);
                passwordMessage1.removeClass('hide');
                passwordMessage2.removeClass('hide');

                if (passwordMatch && passwordRule) {
                    // If the password follows the rule and matches then enable the reset button
                    $('#change-password-button').removeAttr('disabled');
                }

                if (passwordMatch) {
                    passwordMessage2.removeClass('error-message-icon').addClass('success-message-icon');
                    passwordMessage2.html("<span class='fa fa-check-circle ok-icon icon-size'>" +
                        "</span><span style='margin:2px;'>Looks good.</span>");
                } else {
                    passwordMessage2.removeClass('success-message-icon').addClass('error-message-icon');
                    passwordMessage2.html(
                        "<span class='fa fa-exclamation-circle exclamation-icon icon-size'></span>" +
                            "<span  style='margin:2px;'>Passwords don’t match.</span>"
                    );
                }

                if (passwordRule) {
                    passwordMessage1.removeClass('error-message-icon').addClass('success-message-icon');
                    passwordMessage1.html("<span class='fa fa-check-circle ok-icon icon-size'>" +
                        "</span><span style='margin:2px;'>Looks good.</span>");
                } else {
                    passwordMessage1.removeClass('success-message-icon').addClass('error-message-icon');
                    passwordMessage1.html(
                        "<span class='fa fa-exclamation-circle exclamation-icon icon-size'></span>" +
                            "<span  style='margin:2px;'>The new password must follow the rules.</span>"
                    );
                }
            },

            onSignUpClicked: function () {
                this.widget.signUpWidget.render();
            },

            validateTandC: function (tcAcceptedDto, _this) {
                var content, alreadyAccepted;
                content = JSON.parse(tcAcceptedDto);
                alreadyAccepted = content.Body.TCAccepted;
                _this.model.set(content.Body); //Stick name into the model.
                _this.renderGreeting(); //Re-render the greeting message.
                if (!alreadyAccepted) {
                    _this.$('.default-view').addClass('hide');
                    _this.$('.login-modal-dialog').css('width', '600px');
                    _this.$('.tc-view').removeClass('hide');
                    // _this.$('.login-adx-logo').css('margin-left', '0px');
                } else {
                    _this.trigger('on-login-successful');
                    _this.$el.modal('hide');
                    _this.redirectToDashboard(tcAcceptedDto, _this.Email);
                }
            },
            /**
             * Hides the modal.
             *            
             * @method hide (View)
             * @return {Object} Returns the modal
             **/
            hide: function () {
                $('#login-modal').modal('hide');
            },

            /**
             * Renders the modal and its backdrop then
             * hides the modal until it is called.
             *
             * @method render (View)
             * @return {Object} Returns the modal
             **/
            render: function () {
                this.setElement($('#login-form-container'));

                if (window.location.href.indexOf('token') > -1) {
                    $('.login-modal-dialog').css('width', '600px');
                    $('.reset-password-view').removeClass('hide');
                    $('.login-view').addClass('hide');
                }
                return this;
            },

            /**
             * Renders the greeting message in the modal
             * TC view with the user's first and last name.
             *
             * @method renderGreeting (View)
             * @return {Object} Returns the modal
             **/
            renderGreeting: function () {
                var first, last, greetingString, midday, evening, hour, mydate;
                first = this.model.get('firstName');
                last = this.model.get('lastName');

                // Just a small delightful touch. 
                mydate = new Date();
                hour = mydate.getHours();
                midday = 12;
                evening = 18;
                greetingString = 'Good Afternoon';
                if (hour < midday) {
                    greetingString = 'Good Morning';
                }
                if (hour >= evening) {
                    greetingString = 'Good Evening';
                }
                greetingString = greetingString + ' ' + first + ' ' + last + '!';

                this.$('.login-greeting').text(greetingString);
            },

            /**
             * Moves the user to the Dashboard page.
             *
             **/
            redirectToDashboard: function (tcAcceptedDto, email) {
                var body,
                    qs,
                    link;

                qs = common.Common.Utilities.QueryStringToJson();
                body = JSON.parse(tcAcceptedDto).Body;

                link = (qs && qs.ReturnUrl) || '/dashboard';

                track.Raise({
                    Event: track.Events.Agents.Login.Login,
                    Link: link,
                    Value: {
                        FirstName: body.firstName,
                        LastName: body.lastName,
                        Email: email
                    }
                });
            }
        });

        exports.LoginWidget = LoginWidget;

        return LoginWidget;
    }());
});