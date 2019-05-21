/**
 * Houses the login form along with the T&C.
 */
define(function (require) {
	var $				= require('jquery'),
		validate		= require('app/validate'),
        View			= require('app/core/view'),
        Request			= require('app/request'),
		LoginTemplate	= require('text!/Templates/LoginWidget/LoginWidget.html'),

		LoginView;

    LoginView = View.extend({
        template: LoginTemplate,

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

            this.$('.btn-login').text('Logging In...').addClass('btn-throbber disable').
                prop('disabled', true);
            this.$('.alert').hide();
            //Authorization Call
            request = new Request.Request({
                Api: '/auth',
                Data: data,
                Success: function () {
                    _this.trigger('on-login-successful');
                },
                Error: function () {
                    _this.$('.bad-cred-alert').removeClass('hide');
                    _this.$('.bad-cred-alert').show();
                },
                Complete: function () {
                    //This is just aesthetics.
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
        onTcContinue: function () {

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
                Error: function () {
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
            this.$('.forgot-password-view').addClass('hide');
            this.$('.login-view').removeClass('hide');
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

        onTypePassword: function () {
            var passwordMessage1 = $('#password-1-message'),
                passwordMessage2 = $('#password-2-message'),
                passwordMatch = $('#password1').val() === $('#password2').val(),
                passwordRule = $('#password1').val().match(/^.*(?=.{7,50})(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/);//ignore jslint

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
            _this.model.set(content.Body);
            _this.renderGreeting();
            if (!alreadyAccepted) {
                _this.$('.default-view').addClass('hide');
                _this.$('.login-modal-dialog').css('width', '600px');
                _this.$('.tc-view').removeClass('hide');
            } else {
                _this.trigger('on-login-successful');
            }
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

        render: function () {
            this.$el.html(View.renderTemplate(this.template, {
                Email: window.TEAgent.Email
            }));
            return this;
        }
    });

    return LoginView;
});