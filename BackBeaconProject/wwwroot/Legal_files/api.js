/**
 * Defines all API end-points with Adx.
 *
 * In majority of cases, you want to be using this interface for calling the API,
 * which integrates nicely with jQuery Deferred.
 **/
define(function (require) {
    var $               = require('jquery'),
        _               = require('underscore'),
        Request         = require('app/request'),
        Api;

    Api = {
        /** Wraps a |Request| into a basic Deferred object that handles resolution and rejection. **/
        PassthroughCall: function (method, url, data) {
            var req,
                xhrObject,
                $def;

            $def = new $.Deferred();

            req = new Request({
                Api: url,

                Data: data,

                Success: function (resp) {
                    $def.resolve(resp);
                },

                Error: function (jqXHR, status, error, options, respJson, errorManager) {
                    $def.reject(jqXHR, status, error, options, respJson, errorManager);
                }
            });

            xhrObject = _.result(req, method);

            _.extend($def, { xhr: xhrObject });

            return $def;
        },

        QuickSearch: function (criteria) {
            return Api.PassthroughCall('Get', 'search/quick', { code: criteria });
        },

        TravelService: {
            /**
             * Updates a travel service providing some change delta.
             * 
             * @param {} quoteId 
             * @param {} travelServiceId
             * @param {Object} data         fields to update
             */
            Update: function (quoteId, travelServiceId, data) {
                var url;

                url = ['quotes', quoteId, 'travelservices', travelServiceId].join('/');

                return Api.PassthroughCall('Patch', url, data);
            },

            UpdateTravelServiceFinanceStatus: function (quoteId, travelserviceid, data) {
                var url,
                    dto;

                dto = {
                    FinanceSystemSyncStatusTypeId: data.FinanceSystemSyncStatusTypeId,
                    AdminNote: data.Remarks
                };
                url = ['quotes', quoteId, 'travelservices', travelserviceid, 'UpdateFinanceSyncStatus'].join('/');
                return Api.PassthroughCall('Put', url, dto);
            }
        },

        Dev: {
            GetResponseByType: function (type) {
                var url;

                url = 'dev/get?Id=1&Value=' + type;

                return Api.PassthroughCall('Get', url);
            },

            GetValidationRulesForUrl: function (req) {
                return Api.PassthroughCall('Get', 'validation?path=' + req);
            },

            GetNewValidationRulesForUrl: function (req, opts) {
                opts = (opts && '&' + $.param(opts)) || '';

                return Api.PassthroughCall('Get', 'validation/getfrompath?path=' + req + opts);
            },

            GetValidationRulesForInsurance: function (req) {
                return Api.PassthroughCall('Get', 'validation/insurance?' + req);
            }
        },

        Admin: {
            /**
             * Returns a list of all ADX roles.
             **/
            GetRoles: function (usage) {
                var url;

                url = 'roles?usage=' + usage;

                return Api.PassthroughCall('Get', url);
            },

            Jobs: function () {

                var url;

                url = 'admin/jobs';

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns the full list of error message definitions that an admin can update.
             * @returns {} 
             */
            GetErrorMessageDefinitions: function () {
                var url;

                url = 'admin/errormessages';

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Saves an error message definition.
             * 
             * @param {} errorMessage 
             * @returns {} 
             */
            SaveErrorMessageDefinition: function (errorMessage) {
                var url;

                url = 'admin/errormessages/' + errorMessage.ErrorMessageId;

                return Api.PassthroughCall('Put', url, errorMessage);
            },

            Providers: {
                Travelex: {
                    Confirm: function (travelexPolicyTransactionId, data) {
                        var url;

                        url = 'admin/providers/travelex/policies/' + travelexPolicyTransactionId + '/confirm';

                        return Api.PassthroughCall('Post', url, data);
                    }
                }
            }

        },

        SupportTickets: {
            Attach: function (dto) {
                var url = 'supportticket/attach';

                return Api.PassthroughCall('Post', url, dto);
            },

            Send: function (dto) {
                var url = 'supportticket/send';

                return Api.PassthroughCall('Put', url, dto);
            }
        },

        Geo: {
            /**
             * Returns a list of all the countries. The ordering here is customized.
             */
            GetCountries: function () {
                var url,
                    req;

                url = 'catalog/locations/countries/';

                req = Api.PassthroughCall('Get', url);

                return req.then(function (response) {
                    var countries,
                        niceCountryOrder;

                    countries = response.Countries;

                    // Place USA and Canada at the top of the list.
                    niceCountryOrder = ['NNN', 'USA', 'CAN'];

                    // We should find a way to not have to do this.
                    _.each(countries, function (country) {
                        country.Id = country.CountryId;
                        country.Name = country.CountryName;
                        country.Subdivisions = [];
                    });

                    return _.sortBy(countries, function (country) {
                        var index = _.indexOf(niceCountryOrder, country.Country3CharCode);

                        return index !== -1 ? index : 9999;
                    });
                });
            },

            /**
             * Returns a list of state provinces for a given country.
             * @param {Number} countryId the country
             * @returns {Array} list of state/provinces.
             */
            GetStateProvinces: function (countryId) {
                var url;

                url = 'catalog/locations/countries/' + countryId + '/subdivisions';

                return Api.PassthroughCall('Get', url).then(function (resp) {
                    var subdivisions = resp.Subdivisions;

                    _.each(subdivisions, function (s) {
                        s.Id = s.SubdivisionId;
                        s.Name = s.SubdivisionName;
                    });

                    return subdivisions;
                });
            }
        },

        Office: {
            /**
             * Returns a list of all the available offices.
             * @returns {Array} list of offices 
             */
            GetAll: function () {
                var url;

                url = 'office-management/offices';

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns a list of agents for the given office. Note that only authorized users
             * can perform this API call.
             *
             * @return {Array}  array of agents
             **/
            GetAgents: function (officeId) {
                var url;

                url = 'office-management/agents?officeId=' + officeId;

                return Api.PassthroughCall('Get', url);
            },

            SaveAgents: function (agents) {
                var url;

                url = 'office-management/agents';

                return Api.PassthroughCall('Post', url, agents);
            },

            AddAgent: function (agent) {
                var url;

                url = 'office-management/addagent';

                return Api.PassthroughCall('Post', url, agent);
            },

            GetRegulatoryInformation: function (officeId) {
                var url;

                url = 'offices/' + officeId + '/regulatory-information';

                return Api.PassthroughCall('Get', url);
            },

            SaveRegulatoryInformation: function (officeId, dto) {
                var url;

                url = 'offices/' + officeId + '/regulatory-information';

                return Api.PassthroughCall('Put', url, dto);
            }
        },

        Agent: {
            GetDelegatedAgents: function (agentId) {
                var url;

                url = '/agents/' + agentId + '/delegators';

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns the financial/commission statement for the given agent between |fromDate| and |toDate|.
             *
             * @param {Integer} agentId     aDX Agent Id
             * @param {Date}    fromDate    statement start date (ISO-formatted datestamp)
             * @param {Date}    toDate      statement end date (ISO-formatted datestamp)
             **/
            GetStatementForPeriod: function (agentId, fromDate, toDate) {
                var url;

                url = 'report/statement?AgentId=' + agentId + '&dateFrom=' + fromDate + '&dateTo=' + toDate;

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns the list of ADX roles for this agent.
             *
             * @param {Integer} agentId     aDX Agent Id
             **/
            GetRoles: function (agentId) {
                var url;

                url = 'users/roles?agentId=' + agentId;

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Sets the role for this agent.
             *
             * @param {Integer} agentId     aDX Agent Id
             * @param {Array} roles         array of RoleTypes
             **/
            SetRoles: function (agentId, roles) {
                var url;

                url = 'users/roles?agentId=' + agentId;

                return Api.PassthroughCall('Put', url, roles);
            },

            GetAgentDelegationRemote: function (model) {
                var agentId,
                    url;

                if (model && model.isAdmin()) {
                    agentId = model.getAgentId();
                    url = '/api/agents?searchCriteria=%QUERY&usage=delegation&agentId=' + agentId;
                } else {
                    url = '/api/agents?searchCriteria=%QUERY&usage=delegation';
                }

                return url;
            },

            /**
             * Sends a reset password email to the agent.
             * 
             * @param {} email 
             * @returns {} 
             */
            SendResetPasswordEmail: function (email) {
                var url,
                    data;

                url = 'users/resetpassword';

                data = { Email: email };

                return Api.PassthroughCall('Post', url, data);
            },

            /**
             * Sets the new password for the given Set Password Token.
             *
             * @param {String}  token           the set password token
             * @param {String}  newPassword     new password to use
             **/
            SetPassword: function (token, newPassword) {
                var url,
                    data;

                url = 'users/password';

                data = {
                    Token: token,
                    NewPassword: newPassword
                };

                return Api.PassthroughCall('Put', url, data);
            },

            /**
             * Marks the Terms and Conditions for the currently logged in account as accepted.
             **/
            AcceptTermsAndConditions: function () {
                var url;

                url = 'users/AcceptTaC';

                return Api.PassthroughCall('Post', url);
            },

            /**
             * Resends the welcome email to an agent given their agent id.
             *
             * @param {Integer} agentId     the agent id
             **/
            ResendWelcomeEmail: function (agentId) {
                var url;

                url = 'agents/' + agentId + '/signup';

                return Api.PassthroughCall('Post', url);
            },

            /**
             * Returns a list of agents for a first and last name query.
             *
             * @param {String} query    last/first name query
             **/
            Search: function (query, usage) {
                var url = 'agents?searchCriteria=' + query;

                if (usage) {
                    url += '&usage=' + usage;
                }

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Saves the changes to an agent notification.
             *
             * @param {Object} notification the NotificationDto object
             **/
            SaveNotification: function (notification) {
                var url;

                url = 'notifications/update';

                return Api.PassthroughCall('Post', url, notification);
            },

            Get: function (id) {
                var url;

                url = 'agents/' + id;

                return Api.PassthroughCall('Get', url);
            },

            GetSalesReport: function (id) {
                var url;

                url = ['report', 'sales', '?Agents=' + id].join('/');

                return Api.PassthroughCall('Get', url);
            },

            GetUpcomingTravelsReport: function (id) {
                var url;

                url = ['report', 'upcoming-travelings', '?Agents=' +
                        id].join('/');

                return Api.PassthroughCall('Get', url);
            },

            GetInvoiceReport: function (id) {
                var url;

                url = ['report', 'upcoming-invoices', '?Agents=' +
                        id].join('/');

                return Api.PassthroughCall('Get', url);
            },

            GetMessageTemplates: function (id, typeId) {
                var url;

                url = 'agents/' + id + '/messagetemplates';

                if (typeId) {
                    url += '?messageTemplateTypeId=' + typeId;
                }

                return Api.PassthroughCall('Get', url);
            },

            SaveMessageTemplate: function (id, dto) {
                var url;

                url = 'agents/' + id + '/messagetemplates';

                return Api.PassthroughCall('Put', url, dto);
            },

            DeleteMessageTemplate: function (id, dto) {
                var url;

                url = 'agents/' + id + '/messagetemplates';

                return Api.PassthroughCall('Delete', url, dto);
            },

            GetBonVoyageTemplate: function (agentId) {
                var url;

                url = [
                    'agent', agentId, 'bonVoyageTemplate'
                ].join('/');

                return Api.PassthroughCall('Get', url);
            },

            SaveBonVoyageTemplate: function (dto) {
                var url;

                url = 'agent/bonVoyageTemplate';

                return Api.PassthroughCall('Put', url, dto);
            },

            SaveEmailSignature: function (dto) {
                var url;

                url = 'agents/SaveEmailSignature';

                return Api.PassthroughCall('Put', url, dto);
            },

            GetHelpDocuments: function (agentId) {
                var url;

                url = 'help-documents?agentId=' + agentId;

                return Api.PassthroughCall('Get', url);
            }
        },

        Client: {
            /**
             * Returns an aDX client.
             *
             * @param {Integer} clientId    aDX Client Id
             **/
            Get: function (clientId) {
                return Api.PassthroughCall('Get', 'clients/' + clientId);
            },

            /**
             * Saves the client updates.
             * 
             * @param {Integer} clientId    adX Client Id
             * @param {Object} clientDto    ClientDto structure
             */
            Save: function (clientDto) {
                return Api.PassthroughCall('Put', 'clients/' + clientDto.ClientId, clientDto);
            },

            /**
             * Returns all the available companion relationships.
             *
             **/
            GetCompanionRelationships: function () {
                return Api.PassthroughCall('Get', 'clients/companionrelationships');
            },

            SetPrimaryCompanion: function (clientId, params) {
                var url;

                url = ['clients', clientId, 'SetPrimaryCompanion'].join('/');

                return Api.PassthroughCall('Post', url, params);
            }
        },

        QuoteClient: {
            /**
             * Returns an aDX client for a specific quote
             *
             * @param {Integer} clientId    aDX Client Id
             **/
            Get: function (quoteId) {
                return Api.PassthroughCall('Get', 'quotes/' + quoteId + '/client');
            },

            /**
             * Add a client to the quote.
             *
             * @param {Integer} quoteId    aDX Quote Id
             **/
            AddClient: function (quoteId, client) {
                var url;

                url = ['quotes', quoteId, 'contact'].join('/');

                return Api.PassthroughCall('Put', url, client);
            },

            /**
             * Remove a client from the quote.
             *
             * @param {Integer} quoteId    aDX Quote Id
             **/
            RemoveClient: function (quoteId) {
                var url;

                url = ['quotes', quoteId, 'contact'].join('/');

                return Api.PassthroughCall('Delete', url);
            }

        },

        Quote: {
            /**
             * Creates a new aDX Quote.
             **/
            Create: function (quoteParams) {
                return Api.PassthroughCall('Post', 'quotes', quoteParams);
            },

            /**
             * Returns an aDX Quote.
             *
             * @param {Integer} quoteId     aDX Quote Id
             **/
            Get: function (quoteId, opts) {
                opts = (opts && '?' + $.param(opts)) || '';

                return Api.PassthroughCall('Get', 'quotes/' + quoteId + opts);
            },

            /**
             * Saves travelers to a particular quote.
             *
             * @param {Integer} quoteId     aDX Quote Id
             * @param {Array}   travelers   array of TravelerDtos
             **/
            SaveTravelers: function (quoteId, travelServiceId, travelers) {
                var url = 'quotes/' + quoteId;
                //var url = ['quotes', quoteId, 'travelservices', travelServiceId, 'travelers'].join('/');

                if (travelServiceId) {
                    url += '/travelservices/' + travelServiceId;
                }
                url += '/travelers';

                return Api.PassthroughCall('Put', url, travelers);
            },

            GetTravelService: function (quoteId, travelServiceId) {
                return Api.PassthroughCall('Get', 'quotes/' + quoteId + '/travelServices/' + travelServiceId);
            },

            /**
             * Adds a service to the aDX quote.
             *
             * @param {Integer} quoteId     aDX QuoteId
             * @param {Object}  service     service data
             * @param {Integer} clientId    (optional) client to associate with the quote
             **/
            AddService: function (quoteId, service, clientId) {
                var url;

                url = ['quotes', quoteId, 'travelservices'].join('/');

                if (clientId) {
                    url += '?contactClientId=' + clientId;
                }

                return Api.PassthroughCall('Post', url, service);
            },

            /**
             * Pays for one or more travel services for the aDX quote.
             *
             * @param {Integer} quoteId     aDX QuoteId
             * @param {Object}  payment     payment dto
             **/
            MakePayment: function (quoteId, payment) {
                var url;

                url = ['quote', quoteId, 'payments'].join('/');

                return Api.PassthroughCall('Post', url, payment);
            },

            /**
             * Updates the existing service on the aDX quote.
             *
             * @param {Integer} quoteId     aDX QuoteId
             * @param {Integer}  travelServiceId     travel service id
             * @param {Object} travelService    service data
             **/
            UpdateService: function (quoteId, travelServiceId, travelService) {
                var url;

                url = ['quotes', quoteId, 'travelservices', travelServiceId].join('/');

                return Api.PassthroughCall('Put', url, travelService);
            },

            /**
             * Remove the existing service from the aDX quote.
             *
             * @param {Integer} quoteId     aDX QuoteId
             * @param {Integer}  travelServiceId     travel service id
             **/
            RemoveService: function (quoteId, travelServiceId) {
                var url;

                url = ['quotes', quoteId, 'travelservices', travelServiceId, 'remove'].join('/');

                return Api.PassthroughCall('Post', url);
            },


            /**
             * Cancel the existing service on the aDX quote.
             *
             * @param {Integer} quoteId     aDX QuoteId
             * @param {Integer}  travelServiceId     travel service id
             **/
            CancelService: function (quoteId, travelServiceId, dto) {
                var url;

                url = ['quotes', quoteId, 'travelservices', travelServiceId, 'cancel'].join('/');

                return Api.PassthroughCall('Post', url, dto);
            }
        },

        Cruise: {
            /**
             * Attempts to get a Hold on a particular Cruise Cabin.
             *
             * |holdParams| expects:
             *
             * @param {Object} holdParams
             **/
            HoldCabin: function (holdParams) {
                return Api.PassthroughCall('Post', 'services/cruises/book/holdcabin', holdParams);
            },

            /**
             * Attempts to get a Rehold a cabin for a given cruise travel service.
             *
             * @param {Integer}     travelServiceId     cruise travel service id
             * @param {String}      modifyToken         encrypted modify criteria token
             **/
            ReholdCabin: function (travelServiceId, modifyToken) {
                var url = 'services/cruises/book/reholdcabin/' + travelServiceId;

                if (modifyToken) {
                    url += '/' + modifyToken;
                }
                return Api.PassthroughCall('Post', url);
            },

            /**
             * Unholds the held cabin for a given cruise travel service.
             *
             * @param {Integer}     travelServiceId     cruise travel service id
             **/
            UnholdCabin: function (travelServiceId) {
                return Api.PassthroughCall('Post', 'services/cruises/book/unholdcabin' + travelServiceId);
            },

            /**
             * Books a Cruise Service.
             *
             * |bookParams| expects:
             *
             * @param {Integer}     travelServiceId     cruise travel service id
             * @param {Object}      bookParams          booking payload
             **/
            Book: function (travelServiceId, bookParams) {
                return Api.PassthroughCall('Post', 'services/cruises/book/' + travelServiceId, bookParams);
            },

            /**
             * Returns Cruise Search Results for a particular page.
             *
             * |searchParams| expects:
             *
             * @param {Object} searchParams
             **/
            GetSearchResultsPage: function (searchParams) {
                var call,
                    url;

                url = '/catalog/cruises/itineraries/availability/' + searchParams.Token;

                if (searchParams.PageNumber && searchParams.PageNumber > 1) {
                    url += '/' + searchParams.PageNumber;
                }

                if (searchParams.SortBy) {
                    url += '?sortBy=' + searchParams.SortBy + '&sortOrder=' + searchParams.SortOrder;
                }

                call = Api.PassthroughCall('Get', url);

                return call;
            },

            /**
             * Returns the details for a given fare code under a sailing.
             *
             * @param {Integer} sailingId       sailing id
             * @param {String}  fareCode        fare code
             * @param {String}  currencyCode    currency code
             **/
            GetFareCodeDetails: function (sailingId, fareCode, currencyCode) {
                var url = ['services/cruises/sailings',
                    sailingId, 'farecodes', fareCode, 'currencycode', currencyCode].join('/');

                return Api.PassthroughCall('Get', url);
            },

            GetCategoryCriteria: function (sailingId, token) {
                var url = ['services', 'cruises', 'sailings', sailingId,
                        'categories', 'criteria', token].join('/');

                return Api.PassthroughCall('Get', url);
            },

            GetCategoryAvailability: function (sailingId, token) {
                var url = ['services', 'cruises', 'sailings', sailingId,
                        'categories', 'availability', token].join('/');

                return Api.PassthroughCall('Get', url);
            },

            GetCruiseOccupatoins: function (sailingId) {
                var url = ['catalog', 'cruises', 'sailings', sailingId,
                              'farecodes', 'availability', 'searchfilters'].join('/');

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns the Pricing Breakdown for a given cruise booking.
             *
             * |breakdownParams| expects:
             ```
                {
	                TravelServiceId: int,
                    AncillaryServices: [] {
	                    CruiseAncillaryServiceId: int,
                        Association: int,    // 1 - Per Cabin, 2 - Per Passenger
                        TravelerId: int?,
                        OcassionDate: date?
                    }
                }
             ```
             *
             * @param {Object} breakdownParams
             **/
            GetBookingPriceBreakdown: function (breakdownParams) {
                return Api.PassthroughCall('Post', 'services/cruises/book/pricebreakdown', breakdownParams);
            },

            /**
             * Returns the Booking Requirements for a given Cruise Operator.
             *
             * @param {Integer} operatorId          Operator Id
             **/
            GetOperatorBookingRequirements: function (operatorId) {
                return Api.PassthroughCall('Get', 'catalog/cruises/book/items/' + operatorId);
            },

            /**
             * Returns the list of ancillary services available to this travel service.
             *
             * @param {Integer} travelServiceId     cruise travel service id
             **/
            GetAncillaryServices: function (travelServiceId) {
                return Api.PassthroughCall('Get', 'services/cruises/book/ancillaryservices/' + travelServiceId);
            },

            /**
             * Returns the Ship Cabin Categories for a particular cruise travel service.
             *
             * @param {Integer} travelServiceId     cruise travel service id
             **/
            GetShipCabinCategories: function (travelServiceId) {
                var url;

                url = 'travelservice/cruise/' + travelServiceId + '/RetrieveShipCategory';

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns all the cruiseline operators.
             **/
            GetOperators: function () {
                return Api.PassthroughCall('Get', 'catalog/operators?type=Cruise');
            },

            AssociateRclGroup: function (travelServiceId, data) {
                return Api.PassthroughCall('Put', 'services/cruise/' + travelServiceId + '/AssociateRclGroup', data);
            },

            GetBookItems: function (operatorId) {
                var url;

                url = 'catalog/cruises/book/items/' + operatorId;

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns the list of fields that can be modified after a particular cruise service has been booked.
             *
             * @param {Integer} travelServiceId     cruise travel service id
             **/
            GetModifiableBookingFields: function (quoteId, travelServiceId) {
                var url;

                url = ['quotes', quoteId, 'travelservices', travelServiceId, 'ModifiableFields'].join('/');

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns the list of fare codes that can be applied during a Modify Booking flow
             * for a given cruise travel service.
             *
             * @param {Integer} travelServiceId     cruise travel service id
             **/
            GetModifiableBookingFareFodes: function (travelServiceId) {
                var url;

                url = ['services/cruise', travelServiceId, 'fareCode'].join('/');

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Saves the fare codes within the Modify Booking flow.
             *
             * The API call returns a list of potential cabin categories.
             *
             * @param {Integer} travelServiceId     cruise travel service id
             * @param {Object}  params              token and up to two selected fare codes
             **/
            SaveModifiableBookingFareCodes: function (travelServiceId, params) {
                var url;

                url = ['services/cruise', travelServiceId, 'category'].join('/');

                return Api.PassthroughCall('Post', url, params);
            },

            /**
             * Saves the chosen cabin category within the Modify Booking flow.
             *
             * @param {Integer} travelServiceId     cruise travel service id
             * @param {Object}  params              token, fare code and selected cabin category
             **/
            SaveModifiableBookingCabinCategory: function (travelServiceId, params) {
                var url;

                url = ['services/cruise', travelServiceId, 'savecategory'].join('/');

                return Api.PassthroughCall('Post', url, params);
            },

            /**
             * Returns the list of cabin categories available for modification for this travel service.
             *
             * This API call uses the existing fare code within the travel service.
             *
             * @param {Integer} travelServiceId     cruise travel service id
             **/
            GetModifiableBookingCabinCategories: function (travelServiceId) {
                var url;

                url = ['services/cruise', travelServiceId, 'category'].join('/');

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Saves the chosen cabin within the Modify Booking flow.
             *
             * @param {Integer} travelServiceId     cruise travel service id
             * @param {Object}  params              token and the selected cabin
             **/
            SaveModifiableBookingCabin: function (travelServiceId, params) {
                var url;

                url = ['services/cruise', travelServiceId, 'savecabin'].join('/');

                return Api.PassthroughCall('Post', url, params);
            },

            /**
             * Returns a Modify Booking flow token that can then be used to query for list of cabins.
             *
             * @param {Integer} travelServiceId     cruise travel service id
             **/
            GetModifiableBookingCabinToken: function (travelServiceId) {
                var url;

                url = ['services/cruise', travelServiceId, 'cabintoken'].join('/');

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns a Modify Booking flow token that can then be used to query for ancillary services.
             *
             * @param {Integer} travelServiceId     cruise travel service id
             **/
            GetModifiableAncillaryServicesToken: function (travelServiceId) {
                var url;

                url = ['services/cruise', travelServiceId, 'ancillarytoken'].join('/');

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns the list of ancillary services that are selectable within Modify Booking flow.
             *
             * @param {Integer} travelServiceId     cruise travel service id
             * @param {String}  cruiseModifyToken   cruise modify token
             **/
            GetModifiableAncillaryServices: function (travelServiceId, cruiseModifyToken) {
                var url;

                url = ['services/cruise', travelServiceId, 'ancillary?CruiseModifyToken='].join('/')
                    + cruiseModifyToken;

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Saves the ancillary and other per-traveler data within the Modify Booking flow.
             *
             * @param {Integer} travelServiceId     cruise travel service id
             * @param {Object}  params              token, ancillary, insurance, transfers, and dining data
             **/
            SaveModifiableAncillaryServices: function (travelServiceId, params) {
                var url;

                url = ['services/cruise', travelServiceId, 'saveancillary'].join('/');

                return Api.PassthroughCall('Post', url, params);
            },

            /**
             * Returns the Before/After pricing breakdown within the Modify Booking flow.
             *
             * @param {Integer} travelServiceId     cruise travel service id
             * @param {String}  cruiseModifyToken   cruise modify token
             **/
            GetModifiablePricingUpdate: function (travelServiceId, cruiseModifyToken) {
                var url;

                url = ['services/cruise', travelServiceId, 'PriceModifications?CruiseModifyToken='].join('/')
                    + cruiseModifyToken;

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Commits all the changes to the Modify Booking flow. This is the last API call that should be performed
             * in this flow.
             *
             * @param {Integer} travelServiceId     cruise travel service id
             * @param {String}  cruiseModifyToken   cruise modify token
             **/
            SaveBookingModifications: function (travelServiceId, cruiseModifyToken) {
                var url;

                url = ['services/cruise', travelServiceId, 'modify?CruiseModifyToken='].join('/')
                    + cruiseModifyToken;

                return Api.PassthroughCall('Put', url);
            },

            /**
             * Cancel an existing cruise booking.
             *
             * @param {Integer} quoteId             quote id
             * @param {Integer} travelServiceId     cruise travel service id
             * @param {Object}  params              remarks text 
             **/
            RequestCancelCruise: function (quoteId, travelServiceId, params) {
                var url;

                url = ['quotes', quoteId, 'travelservices', travelServiceId, 'cruise/cancel'].join('/');

                return Api.PassthroughCall('Post', url, params);
            },

            /**
          * Cancel an existing cruise booking.
          *
          * @param {Integer} quoteId             quote id
          * @param {Integer} travelServiceId     cruise travel service id
          * @param {Object}  params              remarks text 
          **/
            GetCruiseCancellationDetail: function (quoteId, travelServiceId) {
                var url;

                url = ['quotes', quoteId, 'travelservices', travelServiceId, 'cruise/cancel'].join('/');//ignore jslint

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Saves the Deposit and Final Payment Due dates for a given cruise.
             * 
             * @param {} quoteId                    quote id
             * @param {} travelServiceId            cruise travel service id
             * @param {} data                       payload with dates.
             */
            SavePaymentDates: function (quoteId, travelServiceId, data) {
                var url;

                url = ['quotes', quoteId, 'cruise', travelServiceId].join('/');

                return Api.PassthroughCall('Patch', url, data);
            },

            /**
             * Returns the Ship Details for a given Ship ID.
             * 
             * @param {} shipId 
             * @returns {} 
             */
            GetShipDetails: function (shipId) {
                var url;

                url = 'catalog/cruises/cruiseships/' + shipId;

                return Api.PassthroughCall('Get', url);
            }
        },

        Air: {
            /**
             * Returns all airlines, grouped by their respective currencies.
             *
             * @param {Array} currencies            array of string currencies
             **/
            GetAirlines: function (currencies) {
                var url;

                url = 'catalog/air/airlines';

                if (!currencies && window.TEAgent && window.TEAgent.Currencies) {
                    currencies = $.parseJSON(window.TEAgent.Currencies);
                }

                if (currencies && currencies.length) {
                    url += '?currencies=' + currencies.join(',');
                }

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns all the airline operators.
             **/
            GetOperators: function () {
                return Api.PassthroughCall('Get', 'catalog/operators?type=Air');
            },

            /**
             * Returns a preview version of a seat map given information about a particular flight.
             **/
            GetPreviewSeatMap: function (previewParams) {
                return Api.PassthroughCall('Post', 'services/AirRetrieveSeatMap', previewParams);
            },

            /**
             * Returns a seat map for the given segment.
             **/
            GetSeatMapForSegmentId: function (segmentId) {
                return Api.PassthroughCall('Get', 'services/air/seatmap/' + segmentId);
            },

            GetPnrImportValidationRules: function (quoteId, travelServiceId) {
                var url;

                url = 'validation?path=QuoteTravelServicePnrImport&quoteid=' +
                    quoteId +
                    '&travelserviceid=' +
                    travelServiceId;

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Imports a PNR into aDX
             **/
            ImportPnr: function (quoteId, travelServiceId, data) {
                var url;

                url = ['quotes', quoteId, 'travelservices', travelServiceId, 'air', 'ImportPnr'].join('/');

                return Api.PassthroughCall('Post', url, data);
            },

            /**
             * Saves the seat selections.
             **/
            SaveSeatSelection: function (quoteId, travelServiceId, seatSelections) {
                var url;

                url = ['quotes', quoteId, 'travelservices', travelServiceId, 'air', 'selectseats'].join('/');

                return Api.PassthroughCall('Post', url, seatSelections);
            },

            /**
             * Returns a list of commands allowed through Sabre Cryptic.
             **/
            GetCrypticCommands: function () {
                var url,
                    sabreProviderId;

                sabreProviderId = 5;

                url = 'catalog/pnr/commands/' + sabreProviderId;

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Opens a session with Sabre Cryptic Emulator using a given Record Locator (PNR).
             **/
            OpenCrypticSession: function (quoteId, recordLocator) {
                var url;

                url = ['quotes', quoteId, 'pnrs', recordLocator, 'crypticsession'].join('/');

                return Api.PassthroughCall('Post', url);
            },

            /**
             * Sends a |mask| to the Sabre Cryptic Emulator using the session |key|.
             */
            SendCrypticMask: function (quoteId, recordLocator, key, mask) {
                var url,
                    data;

                url = ['quotes', quoteId, 'pnrs', recordLocator, 'crypticmask'].join('/');

                data = {
                    Command: null,
                    SessionKey: key,
                    MaskCode: mask.MaskCode,
                    FieldValues: mask.FieldValues
                };

                return Api.PassthroughCall('Post', url, data);
            },

            /**
             * Sends a |command| to the Sabre Cryptic Emulator using the session |key|.
             **/
            SendCrypticCommand: function (quoteId, recordLocator, key, command) {
                var url,
                    data;

                url = ['quotes', quoteId, 'pnrs', recordLocator, 'crypticcommand'].join('/');

                data = {
                    Command: command,
                    SessionKey: key
                };
                return Api.PassthroughCall('Post', url, data);
            },

            /**
             * Closes the Sabre Cryptic Emulator Session.
             **/
            CloseCrypticSession: function (quoteId, recordLocator, key) {
                var url,
                    data;

                url = ['quotes', quoteId, 'pnrs', recordLocator, 'crypticsession '].join('/');

                data = {
                    SessionKey: key
                };

                return Api.PassthroughCall('Delete', url, data);
            },

            /**
             * Opens a search session with Sabre Cryptic Emulator using the given search parameters.
             */
            OpenCrypticSearchSession: function (agentId, currencyId, providerId) {
                var url,
                    data;

                data = {
                    AgentId: agentId,
                    SelectedCurrency: currencyId,
                    AirSearchProvider: providerId
                };

                url = 'catalog/air/crypticsearch/startsession';

                return Api.PassthroughCall('Post', url, data);
            },

            /**
             * Sends a |command| to the Sabre Cryptic Emulator using the search session |key|.
             **/
            SendCrypticSearchCommand: function (key, command) {
                var url,
                    data;

                data = {
                    Command: command,
                    SessionKey: key
                };

                url = 'catalog/air/crypticsearch/submitcommand';

                return Api.PassthroughCall('Post', url, data);
            },

            /**
             * Submits the data to perform a flight search and returns the criteria token to
             * use for further stages.
             **/
            CreateFlightSearchCriteriaToken: function (searchData) {
                var url;

                url = 'catalog/air/availabilitycriteria';

                return Api.PassthroughCall('Post', url, searchData);
            },

            /**
             * Returns the search criteria within the given token.
             **/
            GetFlightSearchCriteria: function (token) {
                var url;

                url = 'catalog/air/availabilitycriteria/' + token;

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns the public search criteria within the given token.
             **/
            GetPublicFlightSearchCriteria: function (token) {
                var url;

                url = 'public/catalog/air/availabilitycriteria/' + token;

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns the flight search results given the criteria token and pagination/sorting parameters.
             **/
            GetFlightSearchResults: function (token) {
                var url;

                url = '/catalog/air/mastersearch?token=' + token
                    + '&pageNo=1&resultsPerPage=10&sortBy=1&sortOrder=1&legId=1';

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns the public flight search results given the criteria token and pagination/sorting parameters.
             **/
            GetPublicFlightSearchResults: function (token) {
                var url;

                url = 'public/catalog/air/mastersearch?token=' + token
                    + '&pageNo=1&resultsPerPage=10&sortBy=1&sortOrder=1&legId=1';

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Get the updated Air Price,compare the price with existing price and set a flag for price change.
             **/
            VerifyPrice: function (travelServiceId) {
                var url;

                url = 'services/air/' + travelServiceId + '/VerifyPrice';

                return Api.PassthroughCall('Post', url);
            },

            /**
             * Verify Price for list of air travel services.
             **/
            VerifyAirTravelServicePrices: function (travelServiceIds) {
                var url;

                url = 'catalog/air/VerifyPrice';

                return Api.PassthroughCall('Post', url, { TravelServiceIds: travelServiceIds });
            },

            RevivePnr: function (quoteId, travelServiceId) {
                var url;

                url = ['quotes', quoteId, 'travelservices', travelServiceId, 'air', 'RevivePnr'].join('/');

                return Api.PassthroughCall('Patch', url);
            },


            /**
            * To close a Amadeus Session.
            *
            * @param {String} sessionId      Amadeus Session Id
            **/
            IgnorePnr: function (sessionId) {
                var url;

                url = 'services/air/ignorepnr/' + sessionId;

                return Api.PassthroughCall('Delete', url);
            }
        },

        Insurance: {
            /**
             * Return insurance availability token
             * @param {} InsuranceAvailabilityReqDto criteria
             * @returns {} InsuranceAvailablityResDto results
             */
            AvailablityCriteria: function (criteria) {
                return Api.PassthroughCall('Post', 'insurance/availability/criteria', criteria);
            },

            GetCriteriaForModify: function (quoteId, travelServiceId) {
                return Api.PassthroughCall('Get', 'insurance/availability/criteria?quoteId=' + quoteId
                        + '&travelServiceId=' + travelServiceId);
            },

            AvailablityCriteriaForQuote: function (quoteId) {
                return Api.PassthroughCall('Get', 'insurance/availability/criteria?quoteId=' + quoteId);
            },

            Search: function (token) {
                return Api.PassthroughCall('Get', 'insurance/availability?token=' + token);
            },

            GetProductBenefits: function (productId) {
                return Api.PassthroughCall('Get', 'catalog/insurance/products/' + productId);
            },

            Book: function (quoteId, travelServiceId) {
                var url;

                url = 'quotes/' + quoteId + '/travelservices/' + travelServiceId + '/insurance/book';

                return Api.PassthroughCall('Post', url);
            },

            RequestCancel: function (quoteId, travelServiceId, remarksDto) {
                var url;

                url = 'quotes/' + quoteId + '/travelservices/' + travelServiceId + '/insurance/requestcancel';

                return Api.PassthroughCall('Post', url, remarksDto);
            },

            Modify: function (quoteId, travelServiceId, travelService) {
                var url;

                url = 'quotes/' + quoteId + '/travelservices/' + travelServiceId + '/insurance/modify';

                return Api.PassthroughCall('Post', url, travelService);
            }
        },

        PlanningFee: {

            /**
            * Creates a new planning fee travel service.
            *  
            * Returns an travelServiceId.
            *
            * @param {Integer} quoteId    aDX Quote Id
            * @param {PlanningFeeTravelServiceDto} planningFeeDto
            **/
            Create: function (quoteId, planningFeeDto) {
                var url;

                url = 'quotes/' + quoteId + '/planning-fee';

                return Api.PassthroughCall('Post', url, planningFeeDto);
            },

            /**
            * Modifies an existing planning fee travel service.
            *
            * @param {Integer} quoteId      aDX Quote Id
            * @param {Integer} tsId         aDX Travel Service Id
            * @param {PlanningFeeTravelServiceDto} planningFeeDto
            **/
            Modify: function (quoteId, tsId, planningFeeDto) {
                var url;

                url = 'quotes/' + quoteId + '/planning-fee/' + tsId;

                return Api.PassthroughCall('Put', url, planningFeeDto);
            },

            /**
            * Removes a planning fee travel service from the quote.
            *
            * @param {Integer} quoteId      aDX Quote Id
            * @param {Integer} tsId         aDX Travel Service Id
            **/
            Remove: function (quoteId, tsId) {
                var url;

                url = 'quotes/' + quoteId + '/planning-fee/' + tsId;

                return Api.PassthroughCall('Delete', url);
            },

            /**
            * Removes a planning fee travel service from the quote.
            *
            * @param {Integer} quoteId      aDX Quote Id
            * @param {Integer} tsId         aDX Travel Service Id
            * @param {RemarksDto} remarksDto
            **/
            RequestCancel: function (quoteId, tsId, remarksDto) {
                var url;

                url = 'quotes/' + quoteId + '/travelservices/'
                            + tsId + '/planningfee/requestcancel';

                return Api.PassthroughCall('Post', url, remarksDto);
            },

            /**
            * Confirms cancellation request for a planning fee travel service.
            *
            * @param {Integer} quoteId      aDX Quote Id
            * @param {Integer} tsId         aDX Travel Service Id
            **/
            ConfirmCancel: function (quoteId, tsId, dto) {
                var url;

                url = 'quotes/' + quoteId + '/travelservices/'
                            + tsId + '/planningfee/confirmcancel';

                return Api.PassthroughCall('Post', url, dto);
            },

            GetDefaultsForAgent: function (agentId) {
                var url = 'agents/' + agentId + '/default-planning-fees/';

                return Api.PassthroughCall('Get', url);
            },

            GetDefaultsForOffice: function (officeId) {
                var url = 'offices/' + officeId + '/default-planning-fees/';

                return Api.PassthroughCall('Get', url);
            },

            SaveDefaultsForAgent: function (agentId, dto) {
                var url = 'agents/' + agentId + '/default-planning-fees/';

                return Api.PassthroughCall('Put', url, dto);
            },

            SaveDefaultsForOffice: function (officeId, dto) {
                var url = 'offices/' + officeId + '/default-planning-fees/';

                return Api.PassthroughCall('Put', url, dto);
            },

            CalculateTaxes: function (params) {
                var url = 'finance/taxes/calculate?' + $.param(params);

                return Api.PassthroughCall('Get', url);
            }
        },

        Hotel: {
            /**
             * Given a search term, returns all the matching destinations.
             **/
            GetDestinations: function (term) {
                var url;

                url = 'catalog/hotel/destinations?term=' + term;

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Creates a Hotel Search Criteria token from the given HotelSearchRequestDto.
             **/
            CreateSearchCriteria: function (hotelSearchRequestDto) {
                var url;

                url = 'catalog/hotel/availabilitycriteria';

                return Api.PassthroughCall('Post', url, hotelSearchRequestDto);
            },

            /**
             * Returns the Hotel Search Criteria given the token or the travel service id
             **/
            GetSearchCriteria: function (criteriaToken, travelServiceId) {
                var url;

                if (travelServiceId) {
                    url = 'catalog/hotel/availabilitycriteria?token=' + criteriaToken
                        + '&travelServiceId=' + travelServiceId;
                } else {
                    url = 'catalog/hotel/availabilitycriteria?token=' + criteriaToken;
                }

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns a list of hotels given the search criteria.
             **/
            GetHotelListing: function (criteriatoken, params, forceLiveAvailability) {
                var url;

                url = 'catalog/hotel/availability/' + criteriatoken + '?forceLiveAvailability=' + forceLiveAvailability;

                return Api.PassthroughCall('Post', url, params);
            },

            /**
             * Returns the details for a particular hotel from availResultId.
             **/
            GetHotelRates: function (availResultId, criteriaToken, getaddtonalrates) {
                var url;
                getaddtonalrates = getaddtonalrates || false;
                url = 'catalog/hotel/availability/' + criteriaToken + '/results/'
                    + availResultId + '?getaddtionalrates=' + getaddtonalrates;

                return Api.PassthroughCall('Get', url);
            },

            /**
            * Returns the details for a particular hotel property Id.
            **/
            GetRateForPropertyId: function (propertyId, criteriaToken, getaddtonalrates) {
                var url;
                getaddtonalrates = getaddtonalrates || false;
                url = 'catalog/hotel/availability/' + criteriaToken + '/' + propertyId
                    + '?getaddtionalrates=' + getaddtonalrates;

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns the fare rules and rate details for a particular hotel.
             **/
            GetRateDetailsPreview: function (availResultId, fareId, criteriaToken) {
                var url;

                url = 'catalog/hotel/availability/' + criteriaToken + '/results/' + availResultId + '/rates/' + fareId + '/preview'; //ignore jslint

                return Api.PassthroughCall('Get', url);
            },

            GetRateDetails: function (availResultId, rateId, criteriaToken) {
                var url;

                url = 'catalog/hotel/availability/' + criteriaToken + '/results/' + availResultId + '/rates/' + rateId;

                return Api.PassthroughCall('Get', url);
            },

            GetHotelProperties: function (hotelPropertyId) {
                var url;

                url = 'catalog/hotel/properties/' + hotelPropertyId;

                return Api.PassthroughCall('Get', url);
            },

            GetHotelPropertiesFromProvider: function (travelServiceId, hotelPropertyId) {
                var url;

                url = 'catalog/provider/hotel/properties?travelServiceId=' + travelServiceId
                    + '&hotelPropertyId=' + hotelPropertyId;

                return Api.PassthroughCall('Get', url);
            },

            GetHotelPropertiesFromApi: function (availResultId, criteriaToken) {
                var url;

                url = 'catalog/hotel/availability/' + criteriaToken + '/results/' + availResultId + '/property';

                return Api.PassthroughCall('Get', url);
            },

            Reprice: function (quoteId, travelServiceId, includeAllRates) {
                var url;

                url = 'quotes/' + quoteId + '/travelservices/' + travelServiceId
                        + '/hotel/reprice?includeAllRates=' + includeAllRates;
                return Api.PassthroughCall('Get', url);
            },

            /**
             * Get the updated Air Price,compare the price with existing price and set a flag for price change.
             **/
            VerifyPrice: function (travelServiceId) {
                var url;

                url = 'services/hotel/' + travelServiceId + '/VerifyPrice';

                return Api.PassthroughCall('Get', url);
            },

            /**
             * 
             * @param {} quoteId 
             * @param {} travelServiceId 
             * @param {} checkInDate 
             * @param {} checkOutDate  
             * @returns {} 
             */
            ModifyDates: function (quoteId, travelServiceId, checkInDate, checkOutDate) {
                var url,
                    data;

                url = 'quotes/' + quoteId + '/travelservices/' + travelServiceId + '/hotel/ModifyDates';

                data = {
                    CheckInDate: checkInDate,
                    CheckOutDate: checkOutDate
                };

                return Api.PassthroughCall('Post', url, data);
            },

            /**
             * 
             * @param {} quoteId 
             * @param {} travelServiceId 
             * @param {} rooms 
             * @returns {} 
             */
            ModifyNumberOfGuestsAndRooms: function (quoteId, travelServiceId, rooms) {
                var url,
                    data;

                url = 'quotes/' + quoteId + '/travelservices/' + travelServiceId + '/hotel/GuestsAndRooms';

                data = {
                    Rooms: rooms
                };

                return Api.PassthroughCall('Post', url, data);
            },

            /**
             * 
             * @param {} quoteId 
             * @param {} travelServiceId 
             * @param {} fields 
             * @returns {} 
             */
            ModifyOptionalFields: function (quoteId, travelServiceId, fields) {
                var url;

                url = 'quotes/' + quoteId + '/travelservices/' + travelServiceId + '/hotel/modifyoptionalfields';

                return Api.PassthroughCall('Put', url, fields);
            },

            /**
             * 
             * @param {} quoteId 
             * @param {} travelServiceId 
             * @param {} rateCode 
             * @returns {} 
             */
            ModifyRoomRate: function (quoteId, travelServiceId, rateCode) {
                var url,
                    data;

                url = 'quotes/' + quoteId + '/travelservices/' + travelServiceId + '/hotel/rate';

                data = {
                    HotelRateCode: rateCode
                };

                return Api.PassthroughCall('Post', url, data);
            },

            /**
             * 
             * @param {} quoteHotel 
             * @param {} travelServiceId 
             * @returns {} 
             */
            GetAlternativeRates: function (quoteId, travelServiceId) {
                var url;

                url = 'quotes/' + quoteId + '/travelservices/' + travelServiceId + '/hotel/alternativeRates';

                return Api.PassthroughCall('Get', url);
            },

            /**
             * 
             * @param {} quoteId 
             * @param {} travelServiceId 
             * @param {} rateCode 
             * @returns {} 
             */
            GetAlternativeRateDetails: function (quoteId, travelServiceId, rateCode) {
                var url;

                url = 'quotes/' + quoteId + '/travelservices/'
                    + travelServiceId + '/hotel/alternativeRatedetails?rateCode=' + rateCode;

                return Api.PassthroughCall('Get', url);
            },

            /**
              * Returns the list of hotel facilities details.
              * @returns [{FacilityId,FacilityName}] 
              **/
            GetHotelSearchFilters: function () {
                var url;

                url = 'catalog/hotel/searchfilters/';

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Returns the list of hotel operators.
             * @returns [{HotelChainId,HotelChainName}] 
             **/
            GetHotelOperators: function () {
                var url;

                url = 'catalog/operators?type=Hotel';

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Given a search term, returns all the matching hotels.
             **/
            GetHotelNamesSearch: function (hotelName) {
                var url;

                url = 'catalog/hotel/properties/autocomplete/propertyname?search=' + hotelName;

                return Api.PassthroughCall('Get', url);
            },

            /**
             * Net rate model validation
             **/
            ValidateHotelMarkup: function (markupDetail) {
                var url,
                    data;

                url = 'hotel/nets-markup/ValidateAndUpdateHotelMarkup';

                data = {
                    MarkupDetail: markupDetail
                };

                return Api.PassthroughCall('Post', url, data);
            }
        },

        ExternalService: {
            GetVendors: function (q, agentId) {
                var url;

                url = 'externalvendors?searchCriteria=' + q + '&agentId=' + agentId;

                return Api.PassthroughCall('Get', url);
            },

            GetCurrencies: function () {
                var url;

                url = 'catalog/currencies?usage=ExternalServices';

                return Api.PassthroughCall('Get', url);
            }
        },

        Travelers: {
            /**
             * Return traveler prefereces for air: meal and seats.
             **/
            GetAirPreferences: function () {
                var url = 'travelers/getstaticdetails/6';

                return Api.PassthroughCall('Get', url);
            },
            /**
             * Return possible travelers.
             **/
            GetPossibleTravelers: function (quoteId, travelerId, travelServiceIds, clientId) {
                var url;

                url = 'travelers/possibilities?quoteId=' + quoteId;
                if (travelerId) {
                    url += '&travelerId=' + travelerId;
                }
                if (travelServiceIds && travelServiceIds.length) {
                    url += ('&travelServiceIds=' + travelServiceIds.join('&travelServiceIds='));
                }
                if (clientId) {
                    url += '&clientId=' + clientId;
                }

                return Api.PassthroughCall('Get', url);
            },

            /**
            * Get Traveler Details from TRAMS Profile.
            *
            * @param {Integer} clentId     
            * @param {String} client type        
            * @param {Integer} traveler id
            * @param {Integer} list of travel service id's client type 
            **/
            GetTravelersDetailFromProfile: function (clientId, companionId, clientType, travelerId, travelServiceIds) {
                var url,
                    apiQueryString;

                apiQueryString = [
                    'persontype=' + clientType,
                    'id=' + companionId,
                    'clientid=' + clientId
                ].join('&');

                if (travelerId) {
                    apiQueryString += '&travelerId=' + travelerId;
                }

                if (travelServiceIds && travelServiceIds.length) {
                    apiQueryString += ('&travelServiceIds=' + travelServiceIds.join('&travelServiceIds='));
                }

                url = [
                    'travelers',
                    'fromprofile?' + apiQueryString
                ].join('/');

                return Api.PassthroughCall('Get', url);
            },

            /**
            * Return Traveler Static Details.
            *
            **/
            GetStaticDetails: function () {
                return Api.PassthroughCall('Get', 'travelers/getstaticdetails/6');
            }
        },

        Person: {
            Search: function (query) {
                var url = 'people?searchCriteria=' + query;

                return Api.PassthroughCall('Get', url);
            },

            NamesSearch: function (query) {
                var url = 'people/NamesSearch?searchCriteria=' + query;

                return Api.PassthroughCall('Get', url);
            }
        }
    };

    return Api;
});
