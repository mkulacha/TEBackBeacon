/* //Documentation
 * [Date April 24th, 2013]
 * [Name WorldView.Notifications.js]
 * [Author TravelEdge]
 * [Description Standard library for notifications within the WorldView framework.]
 */
/**
 * This is the applicaiton module which is required for all pages
 * @class Notify
 * @module Framework
 **/
//          Definition          //
//******************************//
//define(["jquery", "app/common", "pnotify"], function ($, common) {
//    "use strict";

define(function (require, exports) {
    'use strict';

    // , exports
    //        exports.LoginWidget = LoginWidget;
    // return LoginWidget;

    var $ = require('jquery'),
        _ = require('underscore'),

        NotifyClass,
        opennotices = 0,
        makeCloseAllNotice,
        closeAllNotice,
        reduceOpenNotices,
        render,
        initialize,
        renderError,
        renderWarning,
        renderSuccess,
        renderInfo,
        renderNotice,
        notificationFactory,
        closeAll,
        stacks;

    require('pnotify');

    reduceOpenNotices = function () {
        opennotices--;
    };

    makeCloseAllNotice = function () {
        if (opennotices > 1) {
            if (closeAllNotice) {
                closeAllNotice.pnotify_remove();
            }

            closeAllNotice = $.pnotify({
                title: "Close All",
                text: '<a href="javascript:require(\'app/notify\').CloseAll();\" class="ui-pnotify-link">' +
                    'Click to close all notifications</a>',
                type: 'info',
                icon: 'fa fa-compass',
                history: false,
                addclass: "stack-bar-top-center",
                width: "703px",
                hide: false,
                closer_hover: false,
                after_close: reduceOpenNotices
            });
        }
    };

    initialize = function () {
        $.pnotify.defaults = _.extend($.pnotify.defaults, {
            stack: { "dir1": "down", "dir2": "left", "push": "bottom", "spacing1": 5, "spacing2": 5 }
        });
        //var comet = require("app/comet");
        //comet.Register(comet.MessageType.Notification, "Notifications", notificationFactory);
    };

    render = function (params) {

        var noticeData;

        noticeData = $.extend({
            title: 'Add "Title"',
            text: 'Add "Text"',
            width: '703px',
            styling: 'bootstrap3',
            //sticker_hover: false,
            closer_hover: false,
            type: 'notice',
            icon: 'fa fa-bullhorn',
            history: false,
            hide: true,
            after_close: reduceOpenNotices
        }, params);

        noticeData = $.extend(noticeData, {
            addclass: 'stack-bar-top-center ' + (noticeData.addclass || '')
        });

        makeCloseAllNotice();
        opennotices++;
        return $.pnotify(noticeData);
    };

    renderError = function (Text, Title) {
        var opts;

        if (Title === undefined) {
            Title = "Important Information";
        }
        opts = {
            type: "error",
            title: Title,
            text: Text,
            icon: "fa fa-exclamation",
            hide: false,
            closer_hover: false
        };

        return render(opts);
    };

    renderWarning = function (Text, Title) {
        var opts;

        if (Title === undefined) {
            Title = "Important Information";
        }
        opts = {
            type: "notice",
            addclass: 'ui-pnotify-alert-warning',
            title: Title,
            text: Text,
            icon: "fa fa-info",
            hide: false,
            closer_hover: false
        };

        return render(opts);
    };

    renderNotice = function (Text) {
        return render({ text: Text, type: "notice", icon: "fa fa-info", title: "Important Information" });
    };

    renderSuccess = function (Text) {
        return render({ text: Text, type: "success", icon: "fa fa-check", title: "Success!" });
    };

    renderInfo = function (Text) {
        return render({ text: Text, type: "info", icon: "fa fa-compass", title: "General Information" });
    };

    notificationFactory = function (message) {
        switch (message.NotificationType) {
        case 1:
            renderError(message.Message);
            break;
        case 2:
            renderSuccess(message.Message);
            break;
        case 3:
            render({ text: message.Message, type: "success", icon: "fa fa-check", title: "Sold!" });
            break;
        default:
            renderInfo(message.Message);
            break;
        }
    };

    closeAll = function () {
        $.pnotify_remove_all();
    };

    stacks = {
        Bottom: {
            addpos2: 0,
            animation: true,
            dir1: "up",
            dir2: "right",
            firstpos1: 20,
            firstpos2: 0,
            nextpos1: 0,
            nextpos2: 0,
            spacing1: 20,
            spacing2: 20
        },
        Top: {
            addpos2: 0,
            animation: true,
            dir1: "down",
            dir2: "right",
            firstpos1: 50,
            firstpos2: 0,
            nextpos1: 0,
            nextpos2: 0,
            spacing1: 0,
            spacing2: 20
        }
    };

    //Public

    NotifyClass = {
        Initialize: initialize,
        Create: {
            Error: renderError,
            Warning: renderWarning,
            Success: renderSuccess,
            Info: renderInfo,
            Notice: renderNotice,
            Render: render
        },
        Delegate: notificationFactory,
        Stacks: stacks,
        CloseAll: closeAll
    };

    exports.Notify = NotifyClass;

    return NotifyClass;
});