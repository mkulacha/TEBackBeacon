/**
 * This is a utility tool that allows for querying of countries and their subdivisions
 * @class GeoTool
 * @module Toolbox
 **/
define(['underscore', 'moment', 'app/request', 'app/external'], function (_, moment, Request, external) {
    var cache = {},
        Tool,
        getStates,
        getCountries,
        saveCache,
        getCache;

    /**
     * Gets the last cache from LocalStorage if it is still valid for quicker retrieval
     * @method getCache
     * @private
     **/
    getCache = function () {
        if (localStorage.getItem('TE-DE-TOOLBOX-GEO-TOOL-TIMEOUT') &&
                moment(localStorage.getItem('TE-DE-TOOLBOX-GEO-TOOL-TIMEOUT')) > moment()) {
            localStorage.removeItem('TE-DE-TOOLBOX-GEO-TOOL-TIMEOUT');
            localStorage.removeItem('TE-DE-TOOLBOX-GEO-TOOL');
        }

        if (localStorage.getItem('TE-DE-TOOLBOX-GEO-TOOL')) {
            cache = JSON.parse(localStorage.getItem('TE-DE-TOOLBOX-GEO-TOOL'));
        }
    };
    /**
     * Saves the current cache to LocalStorage for quicker retrieval
     * @method saveCache
     * @private
     **/
    saveCache = function () {
        if (!localStorage.getItem('TE-DE-TOOLBOX-GEO-TOOL-TIMEOUT')) {
            localStorage.setItem('TE-DE-TOOLBOX-GEO-TOOL-TIMEOUT', moment().add('d', 7).toString());
        }

        localStorage.setItem('TE-DE-TOOLBOX-GEO-TOOL', JSON.stringify(cache));
    };
    /**
     * Performs the work for retrieving states / subdivisions from the API or Cache
     * @method getStates
     * @private
     * @param {String} country Country to specifically query for
     * @param {Function} callback Function to call once a result is available
     **/
    getStates = function (country, callback) {
        var async = (callback !== undefined), result = true, req, countryObj;

        if (country) {
            countryObj = _.find(cache, function (c) {
                return c.Id === country;
            });

            if (countryObj) {
                if (Object.keys(countryObj.Subdivisions).length > 0) {
                    if (async) {
                        callback(countryObj);
                    } else {
                        return countryObj;
                    }
                } else {
                    req = new Request({
                        Async: async,
                        Url: external.TEApiDomain + '/catalog/locations/countries/'
                                                  + countryObj.Id + '/subdivisions',
                        Success: function (data) {
                            var sObj = {};
                            _.each(data.Subdivisions, function (state) {
                                sObj[state.SubdivisionId] = {
                                    Name: state.SubdivisionName.toTitleCase(),
                                    Id: state.SubdivisionId,
                                    Code: state.SubdivisionStateCode
                                };

                            });
                            countryObj.Subdivisions = sObj;
                            //saveCache();

                            if (async) {
                                callback(countryObj);
                            } else {
                                result = countryObj;
                            }
                        }
                    });

                    req.Get();
                }

                return result;
            }

            if (Object.keys(cache).length === 0) {
                return getCountries(function () {
                    getStates(country, callback);
                }, async);
            }
        }

        if (async) {
            callback(null);
        }

        return null;
    };
    /**
     * Performs the work for retrieving countries from the API or Cache
     * @method getCountries
     * @private
     * @param {Function} callback function to call once a result is available
     **/
    getCountries = function (callback, method) {
        var async = method || (callback !== undefined), result = true, req;

        //Has the cache been instantiated?
        if (Object.keys(cache).length > 0) {
            if (async) {
                callback(cache);
            } else {
                result = cache;
            }
            //if not, go get the country list
        } else {
            req = new Request({
                Async: async,
                Url: external.TEApiDomain + '/catalog/locations/countries/',
                Success: function (data) {
                    // Place USA and Canada at the top of the list.
                    var niceCountryOrder = ['NNN', 'USA', 'CAN'];

                    _.each(data.Countries, function (country) {
                        country.Id = country.CountryId;
                        country.Name = country.CountryName;
                        country.Subdivisions = [];
                    });

                    cache = _.sortBy(data.Countries, function (country) {
                        var index = _.indexOf(niceCountryOrder, country.Country3CharCode);

                        return index !== -1 ? index : 9999;
                    });

                    //saveCache();

                    if (async) {
                        callback(cache);
                    } else {
                        result = cache;
                    }
                }
            });
            req.Get();
        }

        return result;
    };

    Tool = function () {
        // getCache();
        /**
         * This is a utility tool that allows for querying of countries and their subdivisions
         * @method Get
         * @param {String} [country] Country to specifically query for
         * @param {Function} callback function to call once a result is available
         **/
        return function (country, callback) {
            if (typeof country === 'function' || country === undefined) {
                return getCountries(country);
            }

            if (typeof country === "number") {
                return getStates(country, callback);
            }

            return null;
        };
    };

    return new Tool();
});