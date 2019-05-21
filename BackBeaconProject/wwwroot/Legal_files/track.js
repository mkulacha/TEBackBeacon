/**
 * Allows us to keep track of user actions and pool them into Google Analytics.
 *
 * To access the Analytics UI, go here: http://www.google.com/analytics and click 'Access Google Analytics'
 * in the top-right corner.
 *
 *
 * Basic Usage
 * -----------
 *
 * Import this file, and simply invoke the Raise function:
```
    track.Raise({
        Event: track.Events.Agents.Quote.Archive
        Value: quoteId
    });
```
 *
 * Occasionally, you may want to redirect to a particular URL after the event has been raised:
```
    track.Raise({
        Event: track.Events.Cruises.Search.NewSearch
        Link: searchResultsUrl
        Value: searchToken
    });
```
 *
 *
 * Adding Events
 * -------------
 *
 * Events are organized by a top-level category depending on the context. These include:
 *
 * Agents   - agents performing an action on the dashboard and clicking on misc. links.
 * Cruises  - cruise search, book, and payment actions.
 * Air      - air search, book, and payment actions.
 * Clients  - searching, creating and removing clients.
 *
 * Your new event will either be a completely new category (ie. Hotel, Insurance) or will be
 * added to an existing category.
 *
 * To add an event, simply append it to the list below following the convention that the other
 * events use.
 *
 * Almost every event will want to pass in a |Value| field to track.Raise. This is a JSON object
 * of your choosing, but most likely it will be either an ID or a small payload that is being
 * sent to an API, or returned by the API.
 *
 * As an example, when a client is created, the Value is the ClientDto that is sent to the
 * Create Client API. It may seem bulky to track at first, but it's handy to have a full payload
 * of what happened during an event so that we do not need to go and chase other events to get
 * the full picture.
 **/
define(function (require) {
    var _ = require('underscore'),
        events;

    events = {
        Agents: {
            SignUp: {
                Success: ['Agents', 'Sign Up', 'Success'],
                Failure: ['Agents', 'Sign Up', 'Failure']
            },
            Leads: {
                ViewAll: ['Agents', 'Leads', 'View All'],
                ViewLead: ['Agents', 'Leads', 'View Lead']
            },
            Quote: {
                ViewAll: ['Agents', 'Quote - ViewAll', 'View All'],
                ViewQuote: ['Agents', 'Quote - ViewQuote', 'View Quote'],
                ViewArchived: ['Agents', 'Quote - ViewArchived', 'View Archived'],
                HideArchived: ['Agents', 'Quote - HideArchived', 'Hide Archived'],
                Sort: ['Agents', 'Quote - Sort', 'Sort'],
                Paginate: ['Agents', 'Quote - Paginate', 'Paginate'],
                Archive: ['Agents', 'Quote - Archive', 'Archive'],
                UnArchive: ['Agents', 'Quote - UnArchive', 'UnArchive'],
                FilterAdd: ['Agents', 'Quote - FilterAdd', 'Filter Add'],
                FilterRemove: ['Agents', 'Quote - FilterRemove', 'Filter Remove'],
                FilterClear: ['Agents', 'Quote - FilterClear', 'Filter Clear']
            },
            View: {
                PDF: ['Agents', 'View - Lead', 'PDF']
            },
            Options: {
                ToggleCommission: ['Agents', 'Options - ToggleCommission', 'Toggle Commission'],
                ChangeBannerImage: ['Agents', 'Options - ChangeBanner', 'Change Banner Image'],
                UploadBannerImage: ['Agents', 'Options - UploadBanner', 'Upload Banner Image'],
                UploadAgentPic: ['Agents', 'Options - UploadPic', 'Upload Agent Picture']
            },
            Notices: {
                ReadNotice: ['Agents', 'Read - Notice', 'Read Notice']
            },
            Read_SupportManual: {
                SupportManual: ['Agents', 'Read - Support Manual', 'Support Manual']
            },
            Click_SupportPage: {
                SupportPage: ['Agents', 'Click - Support Page', 'Support Page']
            },
            Submit_SupportRequest_Success: {
                SupportRequestSuccess: ['Agents', 'Submit - Support Request Success', 'Support Request Success']
            },
            Submit_SupportRequest_Failure: {
                SupportRequestFailure: ['Agents', 'Submit - Support Request Failure', 'Support Request Failure']
            },
            Click_RequestUrgentChecked: {
                RequestUrgentChecked: ['Agents', 'Click - Request Urgent Checked', 'Request Urgent Checked']
            },
            Click_RequestUrgentUnchecked: {
                RequestUrgentUnchecked: ['Agents', 'Click - Request Urgent Unchecked', 'Request Urgent Unchecked']
            },
            Click_CancelAndBackToAdx: {
                CancelAndBackToAdx: ['Agents', 'Click - Cancel And Back To Adx', 'Cancel And Back To Adx']
            },
            Logout: {
                Logout: ['Agents', 'Logout', 'Agent']
            },
            Login: {
                Login: ['Agents', 'Login', 'Login'],
                RememberMe: ['Agents', 'Login', 'Remember Me']
            },
            PromotionViewDocument: {
                View: ['Agents', 'Promotions - View Document - Click', 'View']
            },
            TogglePromotions: {
                ShowMore: ['Agents', 'Promotions - Show More', 'Show More'],
                ShowLess: ['Agents', 'Promotions - Show Less', 'Show Less']
            },
            ManagePromotion: {
                Edit: ['Agents', 'Manage Promotion - Edit', 'Edit'],
                Delete: ['Agents', 'Manage Promotion - Edit', 'Delete']
            },
            QuickSearch: {
                Request: ['Search', 'QuickSearch - Request', 'Quick Search Request']
            }
        },
        Cruises: {
            Search: {
                ChangeSearch: ['Cruises', 'Search - Change', 'Change Search'],
                NewSearch: ['Cruises', 'Search - New', 'New Search'],
                Search: ['Cruises', 'Search - Search', 'Search']
            },
            Navigate: {
                Sort: ['Cruises', 'Search Results - Sort', 'Sort'],
                Paginate: ['Cruises', 'Search Results - Paginate', 'Paginate'],
                SwitchBalcony: ['Cruises', 'Search Results - Balcony', 'Balcony'],
                SwitchAll: ['Cruises', 'Search Results - All', 'All'],
                SwitchInside: ['Cruises', 'Search Results - Inside', 'Inside'],
                SwitchOutside: ['Cruises', 'Search Results - Outside', 'Outside'],
                SwitchSuite: ['Cruises', 'Search Results - Suite', 'Suite'],
                SwitchOceanview: ['Cruises', 'Search Results - Oceanview', 'Oceanview']
            },
            ViewDetails: {
                CruiseDetails: ['Cruises', 'View - Cruise Details', 'Cruise Details'],
                FareCodeSearch: ['Cruises', 'Farecode - Search', 'Fare Code Search'],
                FareCodeSelection: ['Cruises', 'Farecode - Select', 'Fare Code Selection'],
                LoadMore: ['Cruises', 'Farecode - LoadMore', 'Load More'],
                ReturnToSearch: ['Cruises', 'Farecode - Cancel', 'Return To Search'],
                ViewDetails: ['Cruises', 'Farecode - ViewDetails', 'View Details'],
                ViewCommission: ['Cruises', 'Farecode - ViewCommission', 'View Commission']
            },

            Quote: {
                AddToCruise: ['Cruises', 'Quote', 'Add To Cruise'],
                RemoveCruise: ['Cruises', 'Quote', 'Remove Cruise']
            },
            Groups: {
                ViewGroupDetails: ['Cruises', 'Groups - View Details', 'View Group Details'],
                AddGroupToItin: ['Cruises', 'Groups - Add to Itinerary', 'Add Group to Itinerary']
            },
            Itinerary: {
                AddCruise: ['Cruises', 'Itinerary - Add Cruise', 'Add Cruise'],
                RemoveCruise: ['Cruises', 'Itinerary - Remove Cruise', 'Remove Cruise'],
                TitleUpdate: ['Cruises', 'Itinerary - Edit Title', 'Edit Title'],
                AddToRCLGroup: ['Cruises', 'Itinerary - Add to RCL Group', 'Add to RCL Group'],
                RemoveRCLGroup: ['Cruises', 'Itinerary - Remove RCL Group', 'Remove RCL Group'],
                AddRemoveTransfersAndPackagesFees: [
                    'Cruises', 'Itinerary - Add or Remove Transfers and Packages Fees',
                    'Transfers And Packages Fees'
                ]
            },
            SelectCabin: {
                ChangeDeckPlan: ['Cruises', 'Select Cabin - Change Deck Plan', 'Change Deck Plan'],
                ShowCabinDetails: ['Cruises', 'Select Cabin - Show Cabin Details', 'Show Cabin Details'],
                Sort: ['Cruises', 'Select Cabin - Sort', 'Sort'],
                Paginate: ['Cruises', 'Select Cabin - Paginate', 'Paginate'],
                SelectCabin: ['Cruises', 'Select Cabin - Select', 'Select Cabin'],
                ReturnToTripServicesPage: [
                    'Cruises', 'Select Cabin - Cancel',
                    'Return To Trip Services Page'
                ]
            },
            Book: {
                TimerExpired: ['Cruises', 'Book - TimerExpired', 'Timer Expired'],
                HoldLost: ['Cruises', 'Book - HoldLost', 'Cabin Hold Lost'],
                ReHold: ['Cruises', 'Book - ReHold', 'Cabin Re-Hold'],
                BookingSucceeded: ['Cruises', 'Book - Success', 'Cabin Booking Succeeded'],
                BookingFailed: ['Cruises', 'Book - Failed', 'Cabin Booking Failed']
            },
            Pay: {
                Success: ['Cruises', 'Pay - Success', 'Pay Succeeded'],
                Failure: ['Cruises', 'Pay - Failure', 'Pay Failed']
            },
            ManualPayment: {
                Manage: ['Cruises', 'Manual Payment - Manage', 'Manage Manual Payment'],
                Sort: ['Cruises', 'Manual Payment - Sort', 'Sort'],
                Paginate: ['Cruises', 'Manual Payment - Paginate', 'Paginate'],

                SendResconcierge: ['Cruises', 'Manual Payment - Send Resconcierge', 'Send Resconcierge Email'],
                SentResconcierge: ['Cruises', 'Manual Payment - Sent Resconcierge', 'Sent Resconcierge Email'],
                UpdateMiniWvRefNum: [
                    'Cruises', 'Manual Payment - Update Mini Wv Ref Num',
                    'Update Mini WV Information Reference Number'
                ],
                ConfirmWireTransfer: ['Cruises', 'Manual Payment - Confirm Wire Transfer', 'Confirm Wire Transfer'],
                SendPaymentConfirmation: [
                    'Cruises', 'Manual Payment - Send Payment Confirmation',
                    'Send Payment Confirmation Email'
                ],
                SentPaymentConfirmation: [
                    'Cruises', 'Manual Payment - Sent Payment Confirmation',
                    'Sent Payment Confirmation Email'
                ],
                AssignPayment: ['Cruises', 'Manual Payment - Assign Payment', 'Assign Payment'],
                UpdateNotes: ['Cruises', 'Manual Payment - Update Notes', 'Update Manual Payment Notes'],

                BackToList: ['Cruises', 'Manual Payment - Back To List', 'Back To Manual Payment List']
            },
            OutsidePayment: {
                Create: ['Cruises', 'Outside Payment - Create', 'Create Outside Payment'],
                Reconcile: ['Cruises', 'Outside Payment - Reconcile', 'Reconcile Outside Payment'],
                Sort: ['Cruises', 'Outside Payment - Sort', 'Sort'],
                Paginate: ['Cruises', 'Outside Payment - Paginate', 'Paginate'],
                AddPayment: ['Cruises', 'Outside Payment - Add Payment', 'Add Cruise Reconciliation Payment'],
                AddAnotherPayment: [
                    'Cruises', 'Outside Payment - Add Another Payment',
                    'Add Another Cruise Reconciliation Payment'
                ],
                UpdateNotes: ['Cruises', 'Outside Payment - Update Notes', 'Update Outside Payment Notes'],
                BackToList: ['Cruises', 'Outside Payment - Back To List', 'Back To Outside Payment List']
            },
            Cancel: null,
            Modify: null,
            Create: null,
            Email: null
        },

        Air: {
            Search: {
                Success: ['Air', 'Search - Success', 'Air Search Success'],
                Failure: ['Air', 'Search - Failure', 'Air Search Failure'],
                ModifySearch: ['Air', 'Search - Modify Search', 'Modify Air Search']
            },
            SearchResults: {
                FlightSelected: ['Air', 'Search Results - Flight Selected', 'Flight Selected'],
                FlightEdited: ['Air', 'Search Results - Flight Edited', 'Flight Edited'],
                AddPassengers: ['Air', 'Search Results - Add Passengers', 'Air Add Passengers'],
                QuoteOnly: ['Air', 'Search Results - Quote', 'Air Quote Only'],
                QuoteAll: ['Air', 'Search Results - Quote All', 'Air Quote All'],
                Cancel: ['Air', 'Search Results - Cancel', 'Air Search Results Cancel'],
                TabAdded: ['Air', 'Search Results - Tab Added', 'Air Search Results Tab Added'],
                TabClosed: ['Air', 'Search Resultes - Tab Closed', 'Air Search Results Tab Closed']
            },
            Book: {
                Success: ['Air', 'Book - Success', 'Air Booking Success'],
                Failure: ['Air', 'Book - Failure', 'Air Booking Failure']
            },
            Pay: {
                Success: ['Air', 'Pay - Success', 'Air Payment Succeeded'],
                Failure: ['Air', 'Pay - Failure', 'Air Payment Failed']
            },
            Ticket: {
                Success: ['Air', 'Ticket - Success', 'Air Ticketing Success'],
                Failure: ['Air', 'Ticket - Failure', 'Air Ticketing Failure']
            }
        },

        Services: {
            PlanningFee: {
                RemovePlanningFee: ['Services', 'Planning Fee - Remove Planning Fees', 'Remove Planning Fees'],
                EditPlanningFee: ['Services', 'Planning Fee - Edit Planning Fees', 'Edit Planning Fees']
            }
        },

        Clients: {
            Search: {
                NewSearch: ['Clients', 'Search - New Search', 'New Search']
            },
            Add: {
                AddClient: ['Clients', 'Add - Client', 'Add Client']
            },
            Remove: {
                RemoveClient: ['Clients', 'Remove - Client', 'Remove Client'],
                RemoveTraveller: ['Clients', 'Remove - Traveller', 'Remove Traveller']
            },
            ViewDetails: {
                ViewDetails: ['Clients', 'View Details', 'View Client Details']
            },
            Quote: {
                ViewQuote: [],
                SendMessage: []
            },
            Email: {
                EmailItin: ['Clients', 'Email - Itin', 'Email Itinerary'],
                EmailInvoice: ['Clients', 'Email - Invoice', 'Email Invocie'],
                EmailShoreex: ['Clients', 'Email - Shoreex', 'Email Shore Excursion']
            }
        },

        Travellers: {
            Add: ['Travellers', 'Add - Traveller', 'Add Traveller'],
            Remove: ['Travellers', 'Remove - Traveller', 'Remove Traveller'],
            Update: {
                Success: ['Travellers', 'Update - Success', 'Updating Travellers Succeded'],
                Failure: ['Travellers', 'Update - Failure', 'Updating Travellers Failed']
            },
            SaveAsCompanion: ['Travellers', 'Save As Companion - Travellers', 'Save Traveller As Companion Click'],
            AssignExistingPerson: {
                ClickButton: ['Travellers', 'Assign Existing Person - Click Button',
                        'Click Button to Assign Existing Traveller or Companion'],
                Assign: ['Travellers', 'Assign Existing Person - Assign', 'Assign Existing Traveller or Companion'],
                Unassign: ['Travellers', 'Assign Existing Person - Unassign', 'Unassign Existing Traveller']
            },
            AssignToTravelService: {
                ClickButton: ['Travellers', 'Assign to Travel Service - Click Button',
                        'Click Button to Assign Traveller to Travel Service'],
                Assign: ['Travellers', 'Assign to Travel Service - Assign', 'Assign Traveller to Travel Service']
            }
        },

        Quote: {
            AddTravelService: {
                Air: ['Quote', 'Add Travel Service - Air', 'Add Air Travel Service'],
                Cruise: ['Quote', 'Add Travel Service - Cruise', 'Add Cruise Travel Service'],
                Insurance: ['Quote', 'Add Travel Service - Insurance', 'Add Insurance Travel Service']
            },
            CostSummary: {
                Requote: ['Quote', 'Cost Summary - Requote', 'Click Requote on Cost Summary'],
                UpdatePrice: ['Quote', 'Cost Summary - Update Price', 'Click Update Price on Cost Summary'],
                BookCruise: ['Quote', 'Cost Summary - Book Cruise', 'Click Book Cruise on Cost Summary'],
                AirPayment: ['Quote', 'Cost Summary - Air Payment', 'Click Air Payment on Cost Summary'],
                PlanningFeePayment: ['Quote', 'Cost Summary - Planning Fee Payment',
                    'Click Planning Fee Payment on Cost Summary'],
                CruisePayment: ['Quote', 'Cost Summary - Cruise Payment', 'Click Cruise Payment on Cost Summary'],
                TicketFlight: ['Quote', 'Cost Summary - Ticket Flight', 'Click Ticket Flight on Cost Summary']
            }
        },

        Hotels: {
            Search: {
                Success: ['Hotel', 'Search - Success', 'Hotel Search Success'],
                Failure: ['Hotel', 'Search - Failure', 'Hotel Search Failure'],
                ModifySearch: ['Hotel', 'Search - Modify Search', 'Modify Hotel Search'],
                TabClosed: ['Hotel', 'Search Resultes - Tab Closed', 'Hotel Search Results Tab Closed']
            }
        },
        Insurance: null,
        ShoreEx: {
            Itinerary: {
                AddToItineraryFromDetails: ['ShoreEx', 'Itinerary - Add ShoreEx', 'Add ShoreEx from Details'],
                AddToItineraryFromResults: ['ShoreEx', 'Itinerary - Add ShoreEx', 'Add ShoreEx from Results']
            }
        },
        Payments: null,
        Deals: null,
        Leads: null,
        Misc: {
            SuggestOSearch: {
                Search: ['Misc', 'Suggest-O-Search', 'Search']
            }
        }
    };

    /**
 * Combines the label and value to get around numeric only values
 * @method combineLabelValue
 * @private
 * @param {String} label GA Label
 * @param {Any} [value] GA Value
 * @returns {String} A sting that seperates the label and value using a colon ':'
 **/
    function combineLabelValue(label, value) {
        return label + ':' + (value ? JSON.stringify({ Data: value }) : 'null');
    }

    /**
    * Fires the GA tracking call
    * @method track
    * @private
    * @param {String} category Google Analytics Category
    * @param {String} action Google Analytics Action
    * @param {String} label Google Analytics Label
    * @param {Any} [value] Google Analytics Value
    **/
    function track(category, action, label, value, callback) {
        var ga, eventObj;

        ga = window.ga;

        if (ga && category && action && label) {
            eventObj = {
                hitType: 'event',
                eventCategory: category,
                eventAction: action,
                eventLabel: combineLabelValue(label, value)
            };
            if (callback) {
                eventObj.hitCallback = callback;
            }

            ga('send', eventObj);
        }
    }

    function trackPageView() {
        var ga;

        ga = window.ga;

        ga('send', {
            hitType: 'pageview',
            page: location.pathname,
            title: document.title
        });
    }

    /**
    * Fires the GA tracking call
    * @method trackEvent
    * @private
    * @param {Array} event Array of GA params
    * @param {Any} [value] Google Analytics Value
    **/
    function trackEvent(event, value) {
        if (event && typeof event === "object" && event.length === 3) {
            track(event[0], event[1], event[2], value);
        }
    }

    /**
      * Fires the GA tracking call for links
      * @method trackCallback
      * @private     
      * @param {Array} [event] Array of GA params
      * @param {Any} [value] Google Analytics Value
      * @param {Function} [callback] to execute if the request is successful, or GA is not availible
      * @param {Object} [callbackObject] the context of the function, generally the object that calls Track
      * @param {Array} [callbackParameters)] a list of parameters send tthe callback
      **/
    function trackCallback(event, value, callback, callbackObject, callbackParameters) {
        var category, action, label, callbackFunc = null;
        category = event[0];
        action = event[1];
        label = event[2];
        callbackParameters = callbackParameters || [];

        if (!window.ga) {
            // continue on if google analytics is not availible.
            if (callback) {
                callback.apply(callbackObject, callbackParameters);
            }
            return;
        }

        if (callback) {
            if (callbackParameters.constructor !== Array) {
                callbackParameters = [callbackParameters];
            }

            callbackParameters.unshift(callbackObject);
            callbackParameters.unshift(callback);

            callbackFunc = _.bind.apply(_, callbackParameters);
        }

        // send the tracking data
        track(category, action, label, value, callbackFunc);
    }

    /**
    * Fires the GA tracking call for the options supplied
    * @method raiseTrackingEvent
    * @private
    * @param {Object} options GA tracking event options
    **/
    function raiseTrackingEvent(options, callback, callbackObject, callbackParameters) {
        var parameters;
        if (options && options.Event) {
            if (options.Value) {
                options.Value.UserId = window.TEUser ? window.TEUser.Id : 0;
                options.Value.SessionId = window.TESessionId ? window.TESessionId.Id : null;
            }
            if (callback) {
                trackCallback(options.Event, options.Value, callback, callbackObject, callbackParameters);
            } else if (options.Link) {
                parameters = [];
                parameters[0] = options.Link;
                trackCallback(options.Event, options.Value, function (link) {
                    document.location = link;
                }, null, parameters);
            } else {
                trackEvent(options.Event, options.Value);
            }
        }
    }

    return {
        /**
        * Fires the GA tracking call for the options supplied
        * - Event:track.Events
        * - Link: URL
        * - Value: Any
        * @method Raise
        * @param {Object} options GA tracking event options
        **/
        Raise: raiseTrackingEvent,
        UpdatePageView: trackPageView,
        Events: events
    };
});