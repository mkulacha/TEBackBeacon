/**
 * Common functions that are used throughout the digital experience javacript library
 * @class Common
 * @module Framework
 **/
define(function (require, exports) {
    'use strict';

    var $               = require('jquery'),
        _               = require('underscore'),
        Backbone        = require('backbone'),
        toword          = require('toword'),
        moment          = require('moment'),
        accounting      = require('accounting'),
        requestWidget   = require('app/request'),
        EnumTypes       = require('app/enumtypes'),

        CommonClass;

    require('bootstrap');

    CommonClass = (function () {
        var tracelog = false,
            hasFocus = true,
            CurrencySymbols = [],
            eventObservers = [],
            hasOwnProperty = Object.prototype.hasOwnProperty,
            onBlur,
            onFocus,
            onStorage,
            onUnload,
            onFileDragEvent,
            initLegacyCrossDomain,
            events,
            initialize,
            utilities,
            money,
            mustacheLambdas,
            register,
            unregister,
            callbacks,
            fileDrag = false,
            organicDrag = false;

        // Should import this list: http://www.xe.com/symbols.php#section1 and stuff it into it's own file.

        CurrencySymbols['USD'] = '$'; //ignore jslint
        CurrencySymbols['CAD'] = '$'; //ignore jslint
        CurrencySymbols['BMD'] = '$'; //ignore jslint
        CurrencySymbols['GBP'] = '£'; //ignore jslint
        CurrencySymbols['EUR'] = '€'; //ignore jslint
        CurrencySymbols['CNY'] = '¥'; //ignore jslint
        CurrencySymbols['INR'] = '₹'; //ignore jslint
        CurrencySymbols['CHF'] = 'CHF'; //ignore jslint

        onBlur = function () {
            hasFocus = false;
            _.each(eventObservers[events.FocusLost], function (callback) {
                callback();
            });
        };

        onFocus = function () {
            hasFocus = true;
            _.each(eventObservers[events.FocusGained], function (callback) {
                callback();
            });
        };

        onStorage = function (e) {
            e = e.key ? e : e.detail;
            _.each(eventObservers[events.OnStorage], function (callback) {
                callback(e);
            });
        };

        onUnload = function () {
            _.each(eventObservers[events.OnUnload], function (callback) {
                callback();
            });
        };

        onFileDragEvent = function (state) {
            if (fileDrag === true) {
                _.each(eventObservers[events.onFileDragEvent], function (callback) {
                    callback(state);
                });
            }
        };

        initLegacyCrossDomain = function () {
            $.support.cors = true; //this can be part of solution for IE8 xdomain issue
            $.ajaxTransport("+*", function (options, originalOptions, jqXHR) { //ignore jslint
                if (window.XDomainRequest && (options.url.indexOf("http") > -1)) {
                    var xdr;
                    return {
                        send: function (headers, completeCallback) { //ignore jslint
                            // Use Microsoft XDR
                            xdr = new XDomainRequest(); //ignore jslint
                            xdr.open("post", options.url);
                            xdr.onload = function () {
                                if (this.contentType.match(/\/xml/)) {
                                    var dom = new ActiveXObject("Microsoft.XMLDOM"); //ignore jslint
                                    dom.async = false;
                                    dom.loadXML(this.responseText);
                                    completeCallback(200, "success", [dom]);
                                } else {
                                    completeCallback(200, "success", [this.responseText]);
                                }
                            };
                            xdr.ontimeout = function () {
                                completeCallback(408, "error", ["The request timed out."]);
                            };
                            xdr.onerror = function () {
                                completeCallback(404, "error", ["The requested resource could not be found."]);
                            };
                        },
                        abort: function () {
                            if (xdr) {
                                xdr.abort();
                            }
                        }
                    };
                }
            });
        };

        events = {
            FocusGained: 0,
            FocusLost: 1,
            OnStorage: 2,
            OnUnload: 3,
            onFileDragEvent: 4
        };

        _.each(events, function (event) {
            eventObservers[event] = {};
        });


        initialize = function () {
            var fileTimeout;
            $(window).focus(onFocus);
            $(window).blur(onBlur);
            $(window).on('beforeunload', onUnload);
            if (window.XDomainRequest) {
                initLegacyCrossDomain();
            }

            if (window.addEventListener) {
                window.addEventListener("storage", onStorage, true);
            } else {
                window.attachEvent("onstorage", onStorage);
            }

            if (window.FileReader) {
                jQuery.event.props.push('dataTransfer');
                $(document).on('dragstart', function () {
                    organicDrag = true;
                    fileDrag = false;
                });
                $(document).on('dragenter', function () {
                    if (!organicDrag) {
                        fileDrag = true;
                        onFileDragEvent(true);
                    }
                });
                $(document).on('dragover', function (e) {
                    clearTimeout(fileTimeout);
                    e.preventDefault();
                });
                $(document).on('dragleave', function () {
                    fileTimeout = setTimeout(function () {
                        onFileDragEvent(false);
                        organicDrag = false;
                        fileDrag = false;
                    }, 100);
                });

            }
        };

        utilities = {
            parseDate: function (date) {
                return moment(date).utc();
            },
            hasFocus: function () {
                return hasFocus;
            },
            isEmpty: function (obj) {
                var key;
                if (obj === null || obj === undefined) {
                    return true;
                }
                // Assume if it has a length property with a non-zero value
                // that that property is correct.
                if (obj.length && obj.length > 0) {
                    return false;
                }
                if (obj.length === 0) {
                    return true;
                }
                for (key in obj) { //ignore jslint
                    if (hasOwnProperty.call(obj, key)) {
                        return false;
                    }
                }

                return true;
            },
            queryStringToJson: function (queryString) {
                var pairs, obj, name, value;
                obj = {};

                if (queryString === undefined) {
                    queryString = location.search.slice(1);
                }
                pairs = queryString.split('&');
                _.each(pairs, function (pair) {
                    pair = pair.split('=');
                    name = decodeURIComponent(pair[0]);
                    value = decodeURIComponent(pair[1]) || '';
                    if (obj[name]) {
                        if (!obj[name].push) {
                            obj[name] = [obj[name]];
                        }
                        obj[name].push(value);
                    } else {
                        obj[name] = value;
                    }
                });

                return obj;
            },
            getCookie: function (cookieName) {
                var cookies, all, list, i, cookie, p, name, value,
                    cookieval, a, temp, cookieObj;

                cookies = {}; // The object we will return
                all = document.cookie; // Get all cookies in one big string
                if (all === "") { // If the property is the empty string
                    return null; // return no cookies for you
                }
                list = all.split("; "); // Split into individual name=value pairs
                for (i = 0; i < list.length; i++) { // For each cookie
                    cookie = list[i];
                    p = cookie.indexOf("="); // Find the first = sign
                    name = cookie.substring(0, p); // Get cookie name
                    value = cookie.substring(p + 1); // Get cookie value
                    value = decodeURIComponent(value); // Decode the value
                    cookies[name] = value; // Store name and value in object
                }
                // If we didn't find a matching cookie, quit now
                if (cookies[cookieName] === null || cookies[cookieName] === undefined) {
                    return null;
                }

                cookieval = cookies[cookieName];
                a = cookieval.split('&'); // Break it into an array of name/value pairs
                cookieObj = {}; // The object we will return

                for (i = 0; i < a.length; i++) { // Break each pair into an array
                    temp = a[i].split('=');
                    cookieObj[temp[0]] = decodeURIComponent(temp[1]);
                }
                return cookieObj;
            },
            setCookie: function (name, value, days) {
                var date, expires;
                if (days) {
                    date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    expires = "; expires=" + date.toGMTString();
                } else {
                    expires = "";
                }

                document.cookie = name + "=" + value + expires + "; path=/";
            },
            deleteCookie: function (name) {
                this.SetCookie(name, '', -1);
            },
            getSelectedAgents: function () {
                var agents = [];

                if (window.TEAgent) {
                    //Get the Delegated Agents from Cookies
                    agents = this.GetCookie('SelectedAgents') ?
                            this.GetCookie('SelectedAgents').Agents.split(',') : [];
                }
                return agents;
            },
            //1. Add the user to the list of delegated agnets if he is not admin
            //2. Add Selected property to the delegated agents if their IDs are stored in the
            //      SelectedAgents cookie specific to the session.
            //this property is used by search forms on cruise search results page, itinerary page, etc.
            matchDelegatedAgentsWithSelections: function (delegatedAgents) {
                var selectedAgents = this.GetSelectedAgents(),
                    userIsInDelegates;
                selectedAgents = _.reject(selectedAgents, function (agent) {
                    return agent === "0";
                });

                if (window.TEAgent && window.TEAgent.Id !== 0) {
                    userIsInDelegates = _.findWhere(delegatedAgents, { DelegateAgentId: window.TEAgent.Id });
                    if (!userIsInDelegates) {
                        delegatedAgents.unshift({
                            DelegatorFirstName: window.TEAgent.FirstName,
                            DelegatorLastName: window.TEAgent.LastName,
                            DelegateAgentId: window.TEAgent.Id
                        });
                    }
                }
                if (selectedAgents.length === 1) {
                    _.each(selectedAgents, function (agentId) {
                        _.findWhere(delegatedAgents, { DelegateAgentId: parseInt(agentId, 10) }).Selected = true;
                    });
                } else if (delegatedAgents.length > 0) {
                    _.each(delegatedAgents, function (agent) {
                        agent.Selected = false;
                    });
                    delegatedAgents[0].Selected = true;
                }
            },
            getAgentPreferences: function () {
                var userCookie = this.GetCookie('user');
                //Get the agent preferences from the cookies
                if (window.TEAgent && userCookie.Preferences) {
                    return JSON.parse(userCookie.Preferences);
                }
                return null;
            },
            getSupportedCurrencies: function () {
                var userCookies = this.GetCookie('user'),
                    currencies = [],
                    currencyList,
                    i;

                if (window.TEAgent && userCookies !== null && userCookies.SupportedCurrencies !== null) {
                    currencyList = userCookies.SupportedCurrencies.split(",");
                    for (i = 0; i < currencyList.length; i++) {
                        currencies.push({
                            Code: currencyList[i].replace(/[\[\]"]/g, ''),
                            Symbol: money.getCurrencySymbolForCode(currencyList[i].replace(/[\[\]"]/g, ''))
                        });
                    }
                } else {
                    currencies.push({ Code: "USD", Symbol: "$" });
                }
                return currencies;
            },
            isIE8Browser: function () {
                var rv = -1,
                    ua = navigator.userAgent,
                    re = new RegExp(/Trident\/([0-9]{1,}[\.0-9]{0,})/);
                if (re.exec(ua) !== null) {
                    rv = parseFloat(RegExp.$1);
                }
                return (rv === 4);
            },
            countdown: function (e, a, c) {
                var $element = (e) ? $(e) : null,
                    minutes = a.minutes || 0,
                    seconds = a.seconds || 0,
                    callback = c,
                    n,
                    interval;

                if (seconds > 60) {
                    minutes = Math.floor(seconds / 60);
                    seconds = seconds % 60;
                }

                n = function (n) {
                    return n > 9 ? n : "0" + n;
                };


                if ($element !== null) {
                    $element.html(n(minutes) + ':' + n(seconds));
                }

                interval = setInterval(function () {
                    seconds--;
                    if (seconds < 0) {
                        seconds = 59;
                        if (minutes > 0) {
                            minutes--;
                        } else {
                            seconds = 0;
                            clearInterval(interval);

                            if (callback) {
                                callback();
                            }
                        }
                    }

                    if ($element !== null) {
                        $element.html(n(minutes) + ':' + n(seconds));
                    }

                }, 1000);
                return interval;
            },
            Trace: function () {
                if (tracelog) {
                    if (arguments.length === 1) { //ignore jslint
                        console.log(arguments[0]); //ignore jslint
                    } else {
                        console.log(arguments); //ignore jslint
                    }
                }
            },
            IsAdmin: function () {
                var roles;

                if (!window.TEAgent) {
                    return false;
                }

                roles = JSON.parse(window.TEAgent.Roles);

                if (!roles) {
                    return false;
                }

                return _.contains(roles.RolesForUser, 'Administrator');
            }
        };

        money = {
            formatDto: function (moneyDto) {
                var symbol = moneyDto.Symbol || CurrencySymbols[moneyDto.CurrencyCode];

                return moneyDto.CurrencyCode + ' ' +
                    accounting.formatMoney(moneyDto.Amount, symbol);

            },

            /**
             * Sums the array of |moneyDtos| and returns a single MoneyDto object.
             *
             * Note that the array items must all have the same currency code.
             *
             * @param   {Array}     moneyDtos     list of MoneyDtos to sum
             * @return  {MoneyDto}  the summed MoneyDto object
             **/
            sumCurrency: function (moneyDtos) {
                if (Object.keys(_.groupBy(moneyDtos, "CurrencyCode")).length > 1) {
                    throw new Error("CurrencyCode should be the same");
                }
                var sum = 0;
                _.groupBy(moneyDtos, function (total) {
                    sum += total.Amount;
                });
                return { Amount: sum, CurrencyCode: moneyDtos[0].CurrencyCode };
            },

            /**
             * Returns the currency symbol given the currency code.
             *
             * @param   {String}    code     three-letter currency code
             * @return  {String}    the currency symbol
             **/
            getCurrencySymbolForCode: function (code) {
                var symbol,
                    acceptedCodes;

                symbol = CurrencySymbols[code];

                if (!symbol) {
                    acceptedCodes = _.keys(CurrencySymbols).join(', ');

                    throw new Error('Invalid Currency Code provided: ' + code
                        + '. Accepted Currency Codes are: ' + acceptedCodes);
                }

                return symbol;
            }
        };

        mustacheLambdas = {
            formatCommission: function () {
                return function (text, renderContext) {
                    var output,
                        commission = renderContext(text);

                    // Remove line breaks and potential '%' character to ensure proper front-end format
                    // Remove white spaces
                    // Split by "-"
                    commission = commission.replace(/(\r\n|\n|\r|%)/gm, "")
                                           .trim()
                                           .split("-");
                    if (commission[0] === '' && commission[1] === '') {
                        // Data coming back as '-'
                        output = '--';
                    } else if (commission[0] === '0' && commission.length === 1) {
                        // Data coming back as '0% or 0'
                        output = commission[0] + '%';
                    } else if (commission[0] && !commission[1]) {
                        // Data coming back as '<x>-'
                        output = commission[0] + '%';
                    } else if (!commission[0] && commission[1]) {
                        // Data coming back as '-<x>'
                        output = '0%-' + commission[1] + '%';
                    } else if (commission[0] === commission[1]) {
                        // Data comming back as'<x>-<x>'
                        output = commission[0] + '%';
                    } else {
                        // Data coming back as '<x>-<y>'
                        output = commission[0] + '%-' + commission[1] + '%';
                    }

                    return output;
                };
            },
            formatTravelerType: function () {
                return function (text, renderContext) {
                    var travelerType = parseInt(renderContext(text), 10);
                    switch (travelerType) {
                    case EnumTypes.AirTravellerTypes.Adult:
                        return 'Adult';
                    case EnumTypes.AirTravellerTypes.Child:
                        return 'Child';
                    case EnumTypes.AirTravellerTypes.Infant:
                        return 'Infant';
                    case EnumTypes.AirTravellerTypes.LapInfant:
                        return 'Lap Infant';
                    default:
                        return 'Unknown';
                    }
                };
            },
            formatAirCabin: function () {
                return function (text, renderContext) {
                    var airCabinType = parseInt(renderContext(text), 10);
                    switch (airCabinType) {
                    case EnumTypes.AirCabinTypes.Economy:
                        return 'Economy';
                    case EnumTypes.AirCabinTypes.PremiumEconomy:
                        return 'Premium Economy';
                    case EnumTypes.AirCabinTypes.Business:
                        return 'Business';
                    case EnumTypes.AirCabinTypes.First:
                        return 'First';
                    default:
                        return 'Unknown';
                    }
                };
            },
            formatMoney: function () {
                return function (text, renderContext) {
                    var textOutput,
                        decimalIndex,
                        decimals;

                    textOutput = renderContext(text).trim();

                    // This is a MoneyDTO type, and can have a custom currency.

                    decimals = 2;
                    decimalIndex = _.indexOf(textOutput, ':');

                    if (decimalIndex !== -1) {
                        decimals = parseInt(textOutput[decimalIndex + 1], 10);
                        textOutput = textOutput.substring(0, decimalIndex);
                    }

                    if (textOutput === '[object Object]') {
                        return this.CurrencyCode + ' ' +
                            accounting.formatMoney(this.Amount,
                                this.Symbol || CurrencySymbols[this.CurrencyCode], decimals);
                    }

                    // Stand-alone decimal value, assume USD (DEPRECATED).

                    return parseFloat(textOutput).formatMoney();
                };
            },

            formatDate: function (format, sourceFormat) {
                return function () {
                    return function (text, renderContext) {
                        return moment(renderContext(text).trim(), sourceFormat).format(format);
                    };
                };
            },

            formatDuration: function (format, sourceFormat) {
                return function () {
                    return function (text, renderContext) {
                        return moment.duration(renderContext(text).trim(), sourceFormat).format(format);
                    };
                };
            },

            formatCreditCardName: function () {
                return function (text, renderContext) {
                    var creditCardType,
                        creditCardTypeId;

                    creditCardTypeId = parseInt(renderContext(text), 10);

                    switch (creditCardTypeId) {
                    case EnumTypes.CreditCardTypes.UnKnown:
                        creditCardType = 'Unkn';
                        break;

                    case EnumTypes.CreditCardTypes.VisaInternational:
                        creditCardType = 'Visa';
                        break;

                    case EnumTypes.CreditCardTypes.MasterCard:
                        creditCardType = 'MC';
                        break;

                    case EnumTypes.CreditCardTypes.AmericanExpress:
                        creditCardType = 'AMEX';
                        break;

                    case EnumTypes.CreditCardTypes.DiscoverCard:
                        creditCardType = 'DISC';
                        break;

                    case EnumTypes.CreditCardTypes.CarteBlanche:
                        creditCardType = 'CB';
                        break;

                    case EnumTypes.CreditCardTypes.Delta:
                        creditCardType = 'Delta';
                        break;

                    case EnumTypes.CreditCardTypes.DinersClub:
                        creditCardType = 'Diners';
                        break;

                    case EnumTypes.CreditCardTypes.Electron:
                        creditCardType = 'ELEC';
                        break;

                    case EnumTypes.CreditCardTypes.Jcb:
                        creditCardType = 'JCB';
                        break;

                    default:
                        creditCardType = 'Unkn';
                        break;
                    }

                    return creditCardType;
                };
            },

            FormatDistance: function () {
                return function (text, renderContext) {
                    var textOutput = renderContext(text);
                    if (textOutput) {
                        return textOutput + " km";
                    }
                    return "N/A";
                };
            },

            formatQuoteStatusLabel: function () {
                return function (text, renderContext) {
                    var statusId,
                        quoteTypes,
                        formatCssName,
                        fornamtDisplayedName;

                    statusId = parseInt(renderContext(text), 10);
                    quoteTypes = EnumTypes.QuoteStatusTypes;

                    switch (statusId) {
                    case quoteTypes.Draft:
                        formatCssName = 'draft';
                        fornamtDisplayedName = 'draft';
                        break;
                    case quoteTypes.Quote:
                        formatCssName = 'quote';
                        fornamtDisplayedName = 'quote';
                        break;
                    case quoteTypes.PartialBooked:
                        formatCssName = 'partial-booked';
                        fornamtDisplayedName = 'part booked';
                        break;
                    case quoteTypes.Booked:
                        formatCssName = 'booked-no-payment';
                        fornamtDisplayedName = 'booked N/$';
                        break;
                    case quoteTypes.BookedNoPayment:
                        formatCssName = 'booked-no-payment';
                        fornamtDisplayedName = 'booked N/$';
                        break;
                    case quoteTypes.BookedWithPayment:
                        formatCssName = 'booked-with-payment';
                        fornamtDisplayedName = 'booked W/$';
                        break;
                    case quoteTypes.ReadyForTravel:
                        formatCssName = 'ready-for-travel';
                        fornamtDisplayedName = 'travel-ready';
                        break;
                    case quoteTypes.ActionRequired:
                        formatCssName = 'action-required';
                        fornamtDisplayedName = 'action-req';
                        break;
                    case quoteTypes.Closed:
                        formatCssName = 'closed';
                        fornamtDisplayedName = 'closed';
                        break;
                    case quoteTypes.Traveled:
                        formatCssName = 'traveled';
                        fornamtDisplayedName = 'traveled';
                        break;
                    case quoteTypes.Canceled:
                        formatCssName = 'canceled';
                        fornamtDisplayedName = 'canceled';
                        break;
                    default:
                        formatCssName = 'closed';
                        fornamtDisplayedName = 'unknown';
                    }

                    return "<span class='label label-status label-" +
                            formatCssName +
                            "'>" +
                            fornamtDisplayedName +
                            "</span>";
                };
            },

            formatServiceStatusLabel: function () {
                return function (text, renderContext) {
                    var statusId = parseInt(renderContext(text), 10);

                    switch (statusId) {
                    case EnumTypes.TravelServiceStatusTypes.Offered:
                        return '<span class="label-status label-offered">offered</span>';
                    case EnumTypes.TravelServiceStatusTypes.OnRequest:
                        return '<span class="label-status label-on-req">on req</span>';
                    case EnumTypes.TravelServiceStatusTypes.Paid:
                        return '<span class="label-status label-paid">paid</span>';
                    case EnumTypes.TravelServiceStatusTypes.Booked:
                        return '<span class="label-status label-booked">booked</span>';
                    case EnumTypes.TravelServiceStatusTypes.Modified:
                        return '<span class="label-status label-modified">modified</span>';
                    case EnumTypes.TravelServiceStatusTypes.Canceled:
                        return '<span class="label-status label-canceled">canceled</span>';
                    case EnumTypes.TravelServiceStatusTypes.Deposit:
                        return '<span class="label-status label-deposit">deposit</span>';
                    case EnumTypes.TravelServiceStatusTypes.Closed:
                        return '<span class="label-status label-closed">closed</span>';
                    case EnumTypes.TravelServiceStatusTypes.PartialPaid:
                        return '<span class="label-status label-partial-paid">partial paid</span>';
                    case EnumTypes.TravelServiceStatusTypes.Requote:
                        return '<span class="label-status label-requote">requote</span>';
                    case EnumTypes.TravelServiceStatusTypes.Ticketed:
                        return '<span class="label-status label-ticketed">ticketed</span>';
                    case EnumTypes.TravelServiceStatusTypes.SubmittedForTicketing:
                        return '<span class="label-status label-ticketing">ticketing</span>';
                    case EnumTypes.TravelServiceStatusTypes.ReadyForTicketing:
                        return '<span class="label-status label-ticketable">ticketable</span>';
                    case EnumTypes.TravelServiceStatusTypes.PnrChange:
                        return '<span class="label-status label-pnr-change">pnr change</span>';
                    case EnumTypes.TravelServiceStatusTypes.PendingCancel:
                        return '<span class="label-status label-pending-cancel">pending cancel</span>';
                    case EnumTypes.TravelServiceStatusTypes.BookedClientPay:
                        return '<span class="label-status-external label-bookedclientpay">Booked*</span>';
                    case EnumTypes.TravelServiceStatusTypes.Reserved:
                        return '<span class="label-status label-reserved">booked*</span>';
                    case EnumTypes.TravelServiceStatusTypes.PaidWithPoints:
                        return '<span class="label-status label-paidwithpoints">paid*</span>';
                    case EnumTypes.TravelServiceStatusTypes.Purchased:
                        return '<span class="label-status label-purchased">purchased</span>';
                    case EnumTypes.TravelServiceStatusTypes.UnderReview:
                        return '<span class="label-status label-under-review">under review</span>';
                    case EnumTypes.TravelServiceStatusTypes.BookedReserved:
                        return '<span class="label-status label-booked-reserved">Booked</span>';
                    case EnumTypes.TravelServiceStatusTypes.BookedNoPay:
                        return '<span class="label-status label-booked-no-pay">BookedNoPay</span>';
                    default:
                        return 'Unknown';
                    }
                };
            },

            /** format status label for external travel services **/
            formatServiceStatusLabelExternal: function () {
                return function (text, renderContext) {
                    var statusId = parseInt(renderContext(text), 10);

                    switch (statusId) {
                    case EnumTypes.TravelServiceStatusTypes.Offered:
                        return '<span class="label-status-external label-offered">offered</span>';
                    case EnumTypes.TravelServiceStatusTypes.Paid:
                        return '<span class="label-status-external label-paid">paid</span>';
                    case EnumTypes.TravelServiceStatusTypes.Booked:
                        return '<span class="label-status-external label-booked">booked</span>';
                    case EnumTypes.TravelServiceStatusTypes.PartialPaid:
                        return '<span class="label-status-external label-partial-paid">partial paid</span>';
                    case EnumTypes.TravelServiceStatusTypes.Canceled:
                        return '<span class="label-status-external label-canceled">canceled</span>';
                    case EnumTypes.TravelServiceStatusTypes.BookedClientPay:
                        return '<span class="label-status-external label-bookedclientpay">Booked*</span>';
                    case EnumTypes.TravelServiceStatusTypes.Reserved:
                        return '<span class="label-status-external label-reserved">Reserved*</span>';
                    case EnumTypes.TravelServiceStatusTypes.PaidWithPoints:
                        return '<span class="label-status-external label-paidwithpoints">paid*</span>';
                    default:
                        return 'Unknown';
                    }
                };
            },

            formatTravelServiceTypeName: function () {
                return function (text, renderContext) {
                    var serviceId = parseInt(renderContext(text), 10);
                    switch (serviceId) {
                    case EnumTypes.TravelServiceTypes.Cruise:
                        return 'Cruise';
                    case EnumTypes.TravelServiceTypes.Air:
                        return 'Air';
                    case EnumTypes.TravelServiceTypes.Hotel:
                        return 'Hotel';
                    case EnumTypes.TravelServiceTypes.Insurance:
                        return 'Insurance';
                    default:
                        return 'Unknown';
                    }
                };
            },

            formatTravelServiceTypeIcon: function () {
                return function (text, renderContext) {
                    var serviceId = parseInt(renderContext(text), 10);
                    switch (serviceId) {
                    case EnumTypes.TravelServiceTypes.Cruise:
                        return 'icon icon-te-cruise';
                    case EnumTypes.TravelServiceTypes.Air:
                        return 'fa fa-plane';
                    case EnumTypes.TravelServiceTypes.Hotel:
                        return 'icon icon-te-hotel';
                    case EnumTypes.TravelServiceTypes.Insurance:
                        return 'fa fa-umbrella';
                    case EnumTypes.TravelServiceTypes.PlanningFee:
                        return 'fa fa-compass';
                    case EnumTypes.TravelServiceTypes.External:
                        return 'fa fa-external-link';
                    default:
                        return 'Unknown';
                    }
                };
            },

            formatExternalTravelServiceIcon: function () {
                return function (text, renderContext) {
                    var externalServiceTypeId = parseInt(renderContext(text), 10);
                    switch (externalServiceTypeId) {
                    case EnumTypes.ExternalServiceTypes.Cruise:
                        return 'icon icon-te-cruise';
                    case EnumTypes.ExternalServiceTypes.Air:
                        return 'fa fa-plane';
                    case EnumTypes.ExternalServiceTypes.Hotel:
                        return 'icon icon-te-hotel';
                    case EnumTypes.ExternalServiceTypes.Car:
                        return 'icon icon-te-car';
                    case EnumTypes.ExternalServiceTypes.Insurance:
                        return 'fa fa-umbrella';
                    case EnumTypes.ExternalServiceTypes.Tour:
                        return 'icon icon-te-tour';
                    case EnumTypes.ExternalServiceTypes.Transportation:
                        return 'fa fa-bus';
                    case EnumTypes.ExternalServiceTypes.Rail:
                        return 'fa icon fa-train';
                    case EnumTypes.ExternalServiceTypes.Misc:
                        return 'icon icon-te-service';
                    default:
                        return 'Unknown';
                    }
                };
            },

            /** format external type enum into text description **/
            formatExternalServiceType: function () {
                return function (text, renderContext) {
                    var externalServiceTypeId = parseInt(renderContext(text), 10);
                    switch (externalServiceTypeId) {
                    case EnumTypes.ExternalServiceTypes.Cruise:
                        return 'Cruise';
                    case EnumTypes.ExternalServiceTypes.Air:
                        return 'Flight';
                    case EnumTypes.ExternalServiceTypes.Hotel:
                        return 'Hotel';
                    case EnumTypes.ExternalServiceTypes.Car:
                        return 'Car Rental';
                    case EnumTypes.ExternalServiceTypes.Insurance:
                        return 'Insurance';
                    case EnumTypes.ExternalServiceTypes.Tour:
                        return 'Tour';
                    case EnumTypes.ExternalServiceTypes.Transportation:
                        return 'Transportation';
                    case EnumTypes.ExternalServiceTypes.Rail:
                        return 'Rail';
                    case EnumTypes.ExternalServiceTypes.Misc:
                        return 'Misc';
                    default:
                        return 'Unknown';
                    }
                };
            },

            /** format payment method type enum into text description **/
            formatPaymentType: function () {
                return function (text, renderContext) {
                    var paymentMethodTypeId = parseInt(renderContext(text), 10);

                    switch (paymentMethodTypeId) {
                    case EnumTypes.PaymentTypes.CreditCard:
                        return 'CC';
                    case EnumTypes.PaymentTypes.Cash:
                        return 'Cash';
                    case EnumTypes.PaymentTypes.Cheque:
                        return 'Cheque';
                    case EnumTypes.PaymentTypes.Other:
                        return 'Other';
                    default:
                        return 'Unknown';
                    }
                };
            },

            formatServiceStatusButton: function () {
                return function (text, renderContext) {
                    var statusId = parseInt(renderContext(text), 10);

                    switch (statusId) {
                    case EnumTypes.TravelServiceStatusTypes.Offered:
                        return '<span class="bullet-offered"><i class="fa fa-circle"></i></span>';

                    case EnumTypes.TravelServiceStatusTypes.OnRequest:
                        return '<span class="bullet-on-req"><i class="fa fa-circle"></i></span>';

                    case EnumTypes.TravelServiceStatusTypes.Paid:
                        return '<span class="bullet-paid"><i class="fa fa-circle"></i></span>';

                    case EnumTypes.TravelServiceStatusTypes.Canceled:
                        return '<span class="bullet-canceled"><i class="fa fa-circle"></i></span>';

                    case EnumTypes.TravelServiceStatusTypes.Closed:
                        return '<span class="bullet-closed"><i class="fa fa-circle"></i></span>';

                    default:
                        return 'Unknown';
                    }
                };
            },

            formatNotificationType: function () {
                return function (text, renderContext) {
                    var notificationTypeId = parseInt(renderContext(text), 10);

                    switch (notificationTypeId) {
                    case EnumTypes.NotificationsTypes.PaymentDue:
                        return 'Final Payment Due';
                    case EnumTypes.NotificationsTypes.DepositDue:
                        return 'Deposit Due';
                    case EnumTypes.NotificationsTypes.TicketingComplete:
                        return 'Ticketing Complete';
                    case EnumTypes.NotificationsTypes.TicketingError:
                        return 'Ticketing Error';
                    case EnumTypes.NotificationsTypes.PNRChangedByTicketingDesk:
                        return 'PNR Changed';
                    case EnumTypes.NotificationsTypes.PNRCanceled:
                        return 'PNR Canceled';
                    case EnumTypes.NotificationsTypes.PNRReplaced:
                        return 'PNR Replaced';
                    case EnumTypes.NotificationsTypes.TicketingLate:
                        return 'Ticketing Late';
                    case EnumTypes.NotificationsTypes.MessagebyAirline:
                        return 'Message by Airline';
                    case EnumTypes.NotificationsTypes.NoResponsetoSpecialService:
                        return 'No Response to Special Service';
                    case EnumTypes.NotificationsTypes.ScheduleChanges:
                        return 'Schedule Changes';
                    case EnumTypes.NotificationsTypes.PNRChangedByAirline:
                        return 'PNR Changed by Airline';
                    case EnumTypes.NotificationsTypes.AgentDelegations:
                        return 'Agent Delegations';
                    case EnumTypes.NotificationsTypes.SpecialInstructions:
                        return 'Special Instructions';
                    case EnumTypes.NotificationsTypes.NoLastTicketingDate:
                        return 'No Last Ticketing Date';
                    case EnumTypes.NotificationsTypes.AgentGeneratedNotification:
                        return 'Agent Notification';
                    case EnumTypes.NotificationsTypes.CruiseCancelled:
                        return 'Cruise Cancelled';
                    case EnumTypes.NotificationsTypes.ServiceRefunded:
                        return 'Service Refunded';
                    case EnumTypes.NotificationsTypes.BookingCancelledByAirline:
                        return 'Booking Cancelled by Airline';
                    case EnumTypes.NotificationsTypes.LastTicketingDatePassed:
                        return 'Last Ticketing Date Passed';
                    case EnumTypes.NotificationsTypes.AutoTicketingFailed:
                        return 'Auto Ticketing Failed';
                    default:
                        return 'Generic Notice';
                    }
                };
            },

            formatNotificationPriority: function () {
                return function (text, renderContext) {
                    var notificationPriorityId = parseInt(renderContext(text), 10);

                    switch (notificationPriorityId) {
                    case EnumTypes.NotificationPriority.Standard:
                        return 'Standard';
                    case EnumTypes.NotificationPriority.Priority:
                        return 'Priority';
                    case EnumTypes.NotificationPriority.Urgent:
                        return 'Urgent';
                    default:
                        return 'Standard';
                    }
                };
            },

            formatSpecialServiceRequestStatus: function () {
                return function (text, renderContext) {
                    var notificationPriorityId = parseInt(renderContext(text), 10);

                    switch (notificationPriorityId) {
                    case EnumTypes.AirSpecialServiceRequestStatusTypes.Requested:
                        return 'Requested';
                    case EnumTypes.AirSpecialServiceRequestStatusTypes.Confirming:
                        return 'Confirming';
                    case EnumTypes.AirSpecialServiceRequestStatusTypes.Confirmed:
                        return 'Confirmed';
                    case EnumTypes.AirSpecialServiceRequestStatusTypes.NotAvailable:
                    case EnumTypes.AirSpecialServiceRequestStatusTypes.Unavailable:
                        return 'Not Available';
                    case EnumTypes.AirSpecialServiceRequestStatusTypes.Unconfirmed:
                        return 'Unconfirmed';
                    case EnumTypes.AirSpecialServiceRequestStatusTypes.Cancelled:
                        return 'Cancelled';
                    default:
                        return 'Not Available';
                    }
                };
            },

            formatFlightWarningType: function () {
                return function (text, renderContext) {
                    var warningTypeId = parseInt(renderContext(text), 10);

                    switch (warningTypeId) {
                    case EnumTypes.CityPairNoticeTypes.ShortConnection:
                        return '<i data-toggle="tooltip"' +
                                'title="Risky/short connection" data-placement="top"' +
                                'class="fa icon fa-exclamation-triangle advisory-short-conn advisory-icon"></i>';
                    case EnumTypes.CityPairNoticeTypes.LongConnection:
                        return '<i data-toggle="tooltip"' +
                                'title="Long Connection" data-placement="top"' +
                                'class="fa icon fa-clock-o advisory-long-conn advisory-icon"></i>';
                    case EnumTypes.CityPairNoticeTypes.OverNightLayOver:
                        return '<i data-toggle="tooltip"' +
                                'title="Overnight flights/layover"' +
                                'class="fa icon fa-moon-o advisory-overnight advisory-icon"></i>';
                    case EnumTypes.CityPairNoticeTypes.ChangeTerminal:
                        return '<i data-toggle="tooltip"' +
                                'title="Terminal change"' +
                                'class="fa icon fa-arrow-circle-right advisory-terminal advisory-icon"></i>';
                    case EnumTypes.CityPairNoticeTypes.NonTicketableMarketingCarrier:
                        return '<i data-toggle="tooltip"' +
                            'title="Carrier not ticketable within aDX"' +
                            'class="fa icon fa-phone-square advisory-icon"></i>';
                    case EnumTypes.CityPairNoticeTypes.ChangeAirport:
                        return '<i data-toggle="tooltip"' +
                                'title="Airport change"' +
                                'class="fa icon fa-arrow-circle-right advisory-airport advisory-icon"></i>';
                    default:
                        return 'Unknown';
                    }
                };
            },

            formatAirItineraryType: function () {
                return function (text, renderContext) {
                    var itineraryTypeId = parseInt(renderContext(text), 10);

                    switch (itineraryTypeId) {
                    case EnumTypes.AirItineraryTypes.Return:
                        return 'Round Trip';
                    case EnumTypes.AirItineraryTypes.OneWay:
                        return 'One Way';
                    case EnumTypes.AirItineraryTypes.MultiCity:
                        return 'Multi-City';
                    default:
                        return 'Unknown';
                    }
                };
            },

            formatMoneyWithoutCurrency: function () {
                return function (text, renderContext) {
                    var textOutput;

                    textOutput = renderContext(text).trim();

                    return parseFloat(textOutput).formatMoney();
                };
            },

            trimString: function (trimLength) {
                return function () {
                    return function (text, renderContext) {
                        var textOutput;

                        textOutput = renderContext(text).trim();

                        if (textOutput.length > trimLength) {
                            textOutput = textOutput.substr(0, trimLength) + '...';
                        }

                        return textOutput;
                    };
                };
            },

            selectHelper: function (value) {
                return function () {
                    return function (text, renderContext) {
                        var $option = $(renderContext(text)),
                            //Select options use a different attribute than checkboxes
                            attrName = ($option.is('option') ? 'selected' : 'checked');

                        // Kill null / undefined
                        if (value) {
                            //Check that an array was sent in and not an object
                            if (typeof value === "object" && value.length) {
                                _.each(value, function (v) {
                                    if ($option.val() === v) {
                                        $option.attr(attrName, true);
                                    }
                                });
                            //String, integer or boolean
                            } else {
                                if ($option.val() === value) {
                                    $option.attr(attrName, true);
                                }
                            }
                        }

                        //Return the html
                        return $option[0].outerHTML;
                    };
                };
            },

            formatProviderType: function () {
                return function (text, renderContext) {
                    var ProviderType = parseInt(renderContext(text), 10);

                    switch (ProviderType) {
                    case EnumTypes.ProviderTypes.Amadeus:
                        return 'Amadeus';
                    case EnumTypes.ProviderTypes.Sabre:
                        return 'Sabre';
                    default:
                        return 'Unknown';
                    }
                };
            },

            Date: {
                Year: function (args) {
                    var year = moment().year(),
                        options = $.extend({
                            start: year,
                            end: year - 130,
                            val: null
                        }, args);
                    return function () {
                        return function () {
                            var range = _.range(
                                options.start,
                                options.end + (options.start > options.end ? -1 : 1),
                                (options.start > options.end ? -1 : 1)
                            );
                            return _.map(range, function (r) {
                                return '<option value="' + r + '" ' +
                                    (r === options.val ? 'selected="selected"' : '') +
                                    ' >' + r + '</option>';
                            });
                        };
                    };
                },
                Month: function (args) {
                    var options = $.extend({
                        order: 'asc',
                        start: 1,
                        end: 12,
                        val: null,
                        months: ['January', 'February', 'March', 'April', 'May', 'June',
                                 'July', 'August', 'September', 'October', 'November', 'December']
                    }, args);
                    return function () {
                        return function () {
                            var range;

                            if (options.order === 'asc') {
                                range = _.range(
                                    options.start,
                                    (options.start < options.end) ? (options.end < 13 ? options.end + 1 : 13) : 13
                                );

                                if (options.end < options.start) {
                                    range = _.union(range, _.range(1, options.end + 1));
                                }
                            } else {
                                range = _.range(
                                    options.end,
                                    (options.end > options.start) ? (options.start - 1) : 0,
                                    -1
                                );
                                if (options.end < options.start) {
                                    range = _.union(range, _.range(12, options.start - 1));
                                }
                            }

                            return _.map(range, function (r) {
                                return '<option value="' + options.months[r - 1] + '" ' +
                                    (options.months[r - 1] === options.val ? 'selected="selected"' : '') +
                                    ' >' + options.months[r - 1] + '</option>';
                            });
                        };
                    };
                },
                Day: function (args) {
                    var options = $.extend({
                        order: 'asc',
                        start: 1,
                        end: 31,
                        val: null
                    }, args);
                    return function () {
                        return function () {
                            var range;

                            if (options.order === 'asc') {
                                range = _.range(
                                    options.start,
                                    (options.start < options.end) ? (options.end < 32 ? options.end + 1 : 31) : 31
                                );
                                if (options.end < options.start) {
                                    range = _.union(range, _.range(1, options.end + 1));
                                }
                            } else {
                                range = _.range(options.end, (options.end > options.start) ? (options.start) : 0, -1);
                                if (options.end < options.start) {
                                    range = _.union(range, _.range(31, options.start - 1));
                                }
                            }

                            return _.map(range, function (r) {
                                return '<option value="' + r + '" ' +
                                    (r === options.val ? 'selected="selected"' : '') +
                                    ' >' + r + '</option>';
                            });
                        };
                    };
                }
            },
            formatBaggage: function () {
                return function (text, renderContext) {
                    var suffix = '',
                        baggageQuantityType;

                    baggageQuantityType = parseInt(renderContext(text), 10);
                    switch (baggageQuantityType) {
                    case EnumTypes.BaggageQuantityTypes.NumberOfPieces:
                        suffix = 'Pieces';

                        if (this.BaggageQuantity === '1' || this.BaggageQuantity === 1) {
                            suffix = 'Piece';
                        }
                        break;

                    case EnumTypes.BaggageQuantityTypes.Weight:
                            // no unit of measurement? no suffix.
                        break;

                    case EnumTypes.BaggageQuantityTypes.WeightKilos:
                        suffix = 'kg.';
                        break;

                    case EnumTypes.BaggageQuantityTypes.WeightPounds:
                        suffix = 'lbs.';
                        break;
                    }

                    return this.BaggageQuantity + ' ' + suffix;
                };
            },
            formatDistanceUnit: function () {
                return function (text, renderContext) {
                    var distanceMeasure = parseInt(renderContext(text), 10);

                    switch (distanceMeasure) {
                    case EnumTypes.DistanceMeasureType.Kilometers:
                        return 'Kilometers';
                    case EnumTypes.DistanceMeasureType.Miles:
                        return 'Miles';
                    case EnumTypes.DistanceMeasureType.Blocks:
                        return 'Blocks';
                    case EnumTypes.DistanceMeasureType.Hours:
                        return 'Hours';
                    case EnumTypes.DistanceMeasureType.Minutes:
                        return 'Minutes';
                    default:
                        return 'Unknown';
                    }
                };
            },
            formatHotelBookingRequirement: function () {
                return function (text, renderContext) {
                    var bookingType = parseInt(renderContext(text), 10);
                    switch (bookingType) {
                    case EnumTypes.HotelBookingRequirementTypes.None:
                        return 'DCA Other';
                    case EnumTypes.HotelBookingRequirementTypes.Guarantee:
                        return 'DCA Guarantee';
                    case EnumTypes.HotelBookingRequirementTypes.Deposit:
                        return 'DCA Deposit';
                    case EnumTypes.HotelBookingRequirementTypes.PrePay:
                        return 'Prepay';
                    default:
                        return 'Unknown';
                    }
                };
            },
            formatInsuranceProviderType: function () {
                return function (text, renderContext) {
                    var providerType = parseInt(renderContext(text), 10);
                    switch (providerType) {
                    case EnumTypes.InsuranceProviderTypes.Travelex:
                        return "Travelex";
                    case EnumTypes.InsuranceProviderTypes.Manulife:
                        return "Manulife";
                    default:
                        return "Unknown";
                    }
                };
            }
        };

        register = function (Event, Name, Callback) {
            eventObservers[Event][Name] = Callback;
        };

        unregister = function (Event, Name) {
            delete eventObservers[Event][Name];
        };

        callbacks = function (event) {
            return eventObservers[event];
        };

        (function () {
            String.prototype.toTitleCase = function () {
                return this.toLowerCase().replace(/^([a-zA-Z])|\s([a-zA-Z])/g,
                    function ($1) { return $1.toUpperCase(); });
            };

            if (typeof String.prototype.trim !== 'function') {
                String.prototype.trim = function () {
                    return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                };
            }

            /**
             * Formats textarea or other newline potential text to the expected human-readable format.
             *
             * @method paragraphify
             * @param {String} textToProcess String to process to HTML
             * @private
             * @returns {String} Formatted String that can be displayed as HTML
             */
            String.prototype.paragraphify = function () {
                return '<p>' + this.replace(/[\r\n]/g, '<br />') + '</p>';
            };

            String.prototype.formatMoney = function () {
                return this;
            };

            Number.prototype.toWord = toword;

            Number.prototype.padLeft = function (n, str) {
                return (this < 0 ? '-' : '') +
                    new Array(n - String(Math.abs(this)).length + 1) //ignore jslint
                        .join(str || '0') +
                    (Math.abs(this));
            };

            Number.prototype.formatMoney = function (_c, _d, _t) {
                var n = this,
                    c = isNaN(_c = Math.abs(_c)) ? 2 : _c,
                    d = _d === undefined ? '.' : _d,
                    t = _t === undefined ? ',' : _t,
                    s = n < 0 ? '-' : '',
                    i = parseInt(n = Math.abs(+n || 0).toFixed(c), 10).toString(),
                    j = (j = i.length) > 3 ? j % 3 : 0;//ignore jslint
                return s +
                    (j ? i.substr(0, j) + t : '') +
                    i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + t) +
                    (c ? d + Math.abs(n - i).toFixed(c).slice(2) : '');
            };

            Array.prototype.isEmpty = function () {
                return utilities.isEmpty(this);
            };

            $.fn.sum = function () {
                var sum = 0.00;
                if (this.length === 0) {
                    return sum;
                }
                this.each(function () {
                    var val = $(this).val();
                    if (val !== '') {
                        sum += parseFloat(val);
                    }
                });
                return sum;
            };

            $.fn.visible = function () {
                return this.css('visibility', 'visible');
            };

            $.fn.invisible = function () {
                return this.css('visibility', 'hidden');
            };

            Date.now = Date.now || function () {
                return new Date().getTime();
            };

            Object.keys = Object.keys || (function () {
                var hasOwnProperty = Object.prototype.hasOwnProperty,
                    hasDontEnumBug = !{ toString: null }.propertyIsEnumerable("toString"),
                    DontEnums = [
                        'toString',
                        'toLocaleString',
                        'valueOf',
                        'hasOwnProperty',
                        'isPrototypeOf',
                        'propertyIsEnumerable',
                        'constructor'
                    ],
                    DontEnumsLength = DontEnums.length;

                return function (o) {
                    var result = [],
                        name,
                        i = 0;
                    if ((typeof o !== "object" && typeof o !== "function") || o === null) {
                        throw new TypeError("Object.keys called on a non-object");
                    } else {
                        for (name in o) { //ignore jslint
                            if (hasOwnProperty.call(o, name)) {
                                result.push(name);
                            }
                        }

                        if (hasDontEnumBug) {
                            for (i = 0; i < DontEnumsLength; i++) {
                                if (hasOwnProperty.call(o, DontEnums[i])) {
                                    result.push(DontEnums[i]);
                                }
                            }
                        }
                    }

                    return result;
                };

            }());

            Array.prototype.getUnique = function () {
                var u = {}, a = [], i = 0, l = 0;
                for (i = 0, l = this.length; i < l; ++i) {
                    if (!u.hasOwnProperty(this[i])) {
                        a.push(this[i]);
                        u[this[i]] = 1;
                    }
                }
                return a;
            };
            $.fn.serializeObject = function () {
                var o = {},
                    els = this.find('input, select, textarea'),
                    a;

                _.each(els, function (el) {
                    if ($(el).data('serialize-disabled')) {
                        $(el).removeAttr("disabled");
                    }
                });
                a = els.serializeArray();
                _.each(els, function (el) {
                    if ($(el).data('serialize-disabled')) {
                        $(el).attr("disabled", "disabled");
                    }
                });

                $.each(a, function () {
                    if (o[this.name]) {
                        if (!o[this.name].push) {
                            o[this.name] = [o[this.name]];
                        }
                        o[this.name].push(this.value || '');
                    } else {
                        o[this.name] = this.value || '';
                    }
                });
                return o;
            };
            $.fn.element = function (s) {
                return (s)
                    ? this.before(s).remove()
                    : jQuery("&lt;p&gt;").append(this.eq(0).clone()).html();
            };


            Backbone.UniqueCollection = Backbone.Collection.extend({
                identity: 'id',
                add: function (object) {
                    // Using isDupe routine
                    var _this = this,
                        isDupe = this.any(function (_object) {
                            return _object.get(_this.identity) === object.get(_this.identity);
                        });

                    if (isDupe) {
                        // dont add if it is a dupe
                        return false;
                    }
                    Backbone.Collection.prototype.add.call(this, object);
                },

                comparator: function () {
                    return this.identity;
                }
            });

            (function () {
                var proxiedSync = Backbone.sync,
                    BackboneReq = function (method, model, options) {
                        this.Request = function () {
                            var ops = {};
                            $.extend(ops, options);
                            return proxiedSync(method, model, ops);
                        };
                    };
                BackboneReq.prototype.RetryLast = function () {
                    this.Request();
                };

                Backbone.sync = function (method, model, options) {
                    var proxiedError, ajaxReq;

                    options = options || {};

                    proxiedError = options.error || function () { };

                    if (!options.crossDomain) {
                        options.crossDomain = true;
                    }
                    //if (!options.xhrFields) {
                    //    options.xhrFields = { withCredentials: true };
                    //}
                    options.error = function (jqXHR, status, error) {
                        var respJson;

                        if (jqXHR.status === 401) {
                            requestWidget.queueRequest(ajaxReq);

                            if (!requestWidget.isLoginPending()) {
                                requestWidget.promptLogin();
                            }
                        } else {
                            respJson = jqXHR.responseJSON;
                            if (window.TEAgent) {
                                requestWidget.handleResponseError(jqXHR, respJson, this); // status, error, 

                                proxiedError(jqXHR, status, error);
                            }
                        }

                    };

                    ajaxReq = new BackboneReq(method, model, options);
                    return ajaxReq.Request();
                };
            }());
        }()); //Load these IMMEDIATELY

        return {
            /* [Initialize Initializes page event listners.] */
            Initialize: initialize,

            /* [Utilities|COL Collection of common utilities that were not added to various prototypes] */
            Utilities: {
                /* [Utilities.LoadExternal Attempts to load the external data at the given url. 
                Specifically used for template loading.] */
                //LoadExternal: utilities.loadExternal,
                /* [Utilities.ParseDate Calls momentjs on the supplied date and 
                turns it into utc. Often easier to call this directly...] */
                ParseDate: utilities.parseDate,
                /* [Utilities.PageHasFocus Returns whether or not the page/tab has 
                focus. Not 100% reliable, there are many edge cases.] */
                PageHasFocus: utilities.hasFocus,
                /* [Utilities.IsEmpty Checks if a supplied object is empty or null] */
                IsEmpty: utilities.isEmpty,
                /* [Utilities.QueryStringToJson converts a query string to a JSON object. 
                if no & delimited list is provided it grabs the query string form the browser's location object] */
                QueryStringToJson: utilities.queryStringToJson,
                GetCookie: utilities.getCookie,
                SetCookie: utilities.setCookie,
                DeleteCookie: utilities.deleteCookie,
                GetSelectedAgents: utilities.getSelectedAgents,
                MatchDelegatedAgentsWithSelections: utilities.matchDelegatedAgentsWithSelections,
                GetAgentPreferences: utilities.getAgentPreferences,
                GetSupportedCurrencies: utilities.getSupportedCurrencies,
                IsIE8Browser: utilities.isIE8Browser,
                CountDown: utilities.countdown,
                Trace: utilities.Trace,
                IsAdmin: utilities.IsAdmin,
                FormatCkEditorToQuill: function (text) {
                    if (!text) {
                        return text;
                    }

                    text = text
                        .replace(/comic sans ms,cursive/g, 'cursive')
                        .replace(/lucida sans unicode,lucida grande,sans-serif/g, ' \"Lucida Sans Unicode\"')
                        .replace(/arial,helvetica,sans-serif/g, 'Arial')
                        .replace(/georgia,serif/g, 'Georgia');

                    return text;
                }
            },

            Money: {
                FormatDto: function (moneyDto) {
                    var symbol = moneyDto.Symbol || CurrencySymbols[moneyDto.CurrencyCode];
                    return moneyDto.CurrencyCode + ' ' +
                        accounting.formatMoney(moneyDto.Amount, symbol);
                },

                FormatDtoRoundUpAmount: function (moneyDto) {
                    return moneyDto.CurrencyCode + ' ' +
                        accounting.formatMoney(accounting.toFixed(moneyDto.Amount),
                            moneyDto.Amount.Symbol || CurrencySymbols[moneyDto.CurrencyCode], 0);
                },

                formatDtoWithoutCurrencyCode: function (moneyDto) {
                    var symbol = moneyDto.Symbol || CurrencySymbols[moneyDto.CurrencyCode];

                    return accounting.formatMoney(moneyDto.Amount, symbol);
                },

                /**
                 * Sums the array of |moneyDtos| and returns a single MoneyDto object.
                 *
                 * Note that the array items must all have the same currency code.
                 *
                 * @param   {Array}     moneyDtos     list of MoneyDtos to sum
                 * @return  {MoneyDto}  the summed MoneyDto object
                 **/
                SumCurrency: function (moneyDtos) {
                    if (Object.keys(_.groupBy(moneyDtos, "CurrencyCode")).length > 1) {
                        throw new Error("CurrencyCode should be the same");
                    }
                    var sum = 0;
                    _.groupBy(moneyDtos, function (total) {
                        sum += total.Amount;
                    });
                    return { Amount: sum, CurrencyCode: moneyDtos[0].CurrencyCode };
                },

                /**
                 * Returns the currency symbol given the currency code.
                 *
                 * @param   {String}    code     three-letter currency code
                 * @return  {String}    the currency symbol
                 **/
                GetCurrencySymbolForCode: function (code) {
                    var symbol,
                        acceptedCodes;

                    symbol = CurrencySymbols[code];

                    if (!symbol) {
                        acceptedCodes = _.keys(CurrencySymbols).join(', ');

                        throw new Error('Invalid Currency Code provided: ' + code
                            + '. Accepted Currency Codes are: ' + acceptedCodes);
                    }

                    return symbol;
                }
            },

            /**
             * Handy functions for use inside of mustache templates.
             **/
            MustacheLambdas: {
                /** Format commission **/
                FormatCommission: mustacheLambdas.formatCommission,
                /** Format appropriate maturity type based on id given **/
                FormatTravelerType: mustacheLambdas.formatTravelerType,
                /** Format air cabin type based on id given **/
                FormatAirCabin: mustacheLambdas.formatAirCabin,
                /** Formats money and prepends a currency symbol in front (ie. $5,430.25). **/
                FormatMoney: mustacheLambdas.formatMoney,

                /** Formats  money without any currency attachments. Use this in special cases ONLY. **/
                FormatMoneyWithoutCurrency: mustacheLambdas.formatMoneyWithoutCurrency,

                /** Formats date - takes in the formatting string as the only parameter. **/
                FormatDate: mustacheLambdas.formatDate,

                /** Formats duration **/
                FormatDuration: mustacheLambdas.formatDuration,

                /** Formats the span-labels for Service Status Types. **/
                FormatServiceStatusLabel: mustacheLambdas.formatServiceStatusLabel,

                /** Formats the span-labels for Service Status Types for external services. **/
                FormatServiceStatusLabelExternal: mustacheLambdas.formatServiceStatusLabelExternal,

                /** Formats the text for External Service Type Ids. **/
                FormatExternalServiceType: mustacheLambdas.formatExternalServiceType,

                FormatExternalTravelServiceIcon: mustacheLambdas.formatExternalTravelServiceIcon,

                FormatTravelServiceTypeIcon: mustacheLambdas.formatTravelServiceTypeIcon,

                FormatTravelServiceTypeName: mustacheLambdas.formatTravelServiceTypeName,

                /** Formats the text for Payment Method Type Ids. **/
                FormatPaymentType: mustacheLambdas.formatPaymentType,

                FormatServiceStatusButton: mustacheLambdas.formatServiceStatusButton,

                FormatNotificationType: mustacheLambdas.formatNotificationType,

                FormatNotificationPriority: mustacheLambdas.formatNotificationPriority,

                FormatFlightWarningType: mustacheLambdas.formatFlightWarningType,

                FormatSpecialServiceRequestStatus: mustacheLambdas.formatSpecialServiceRequestStatus,

                FormatAirItineraryType: mustacheLambdas.formatAirItineraryType,

                FormatProviderType: mustacheLambdas.formatProviderType,

                FormatCreditCardName: mustacheLambdas.formatCreditCardName,

                FormatDistance: mustacheLambdas.FormatDistance,

                /** Formats the quote status on dashboard and quote-list page **/
                FormatQuoteStatusLabel: mustacheLambdas.formatQuoteStatusLabel,

                SelectHelper: mustacheLambdas.selectHelper,
                DateHelpers: {
                    Year: mustacheLambdas.Date.Year,
                    Month: mustacheLambdas.Date.Month,
                    Day: mustacheLambdas.Date.Day
                },

                /** Format appropriate baggage type based on id given **/
                FormatBaggage: mustacheLambdas.formatBaggage,

                FormatDistanceUnit: mustacheLambdas.formatDistanceUnit,

                FormatHotelBookingRequirement: mustacheLambdas.formatHotelBookingRequirement,

                FormatInsuranceProviderType: mustacheLambdas.formatInsuranceProviderType,

                TrimString: mustacheLambdas.trimString
            },

            /* [Register Used for registering observer callbacks with the common script. 
            When the specified message type is recieved, all registed callbacks will be called.]
             * [Event Type of event that you want to listen for.]
             * [Name Unique identifier for the listener. Used for dynamic unregistering.]
             * [Callback The function that should be called when an event that matches the event parameter is received.]
             */
            Register: register,
            Unregister: unregister,
            Registrations: callbacks,
            /* [Events|Enum Event types that can be registered] */
            Events: events
        };
    }());
    exports.Common = CommonClass;

    return CommonClass;
});