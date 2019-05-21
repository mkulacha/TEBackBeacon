/**
 * Fetches templates from the server on-the-fly, and caches them locally for re-use.
 **/
define(function () {
    'use strict';

    return (function () {
        return {
            TEApiDomain: window.TEApiUrl || '/api'
        };
    }());
});