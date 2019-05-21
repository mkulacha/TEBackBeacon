/**
 * This is the application module which is required for all pages
 * @class Validate
 * @module Widget
 **/
define(function (require, exports) {
    "use strict";

    var $               = require('jquery'),
        _               = require('underscore'),
        errorManager    = require('app/error.manager'),
        moment          = require('moment'),

        createError,
        createErrorFromValidationResults,
        clearError,
        clearAll,
        createValidationAttributesFromRuleset,
        setValidator,
        removeValidator,
        getNamedValidationPaths,
        regularExpressions,
        filterInt,
        filterFloat,
        validators,
        validationElements,
        resolveValidation,
        _gatherValidationNodesRecursive,
        _getValidationNodesForPath;

    require('bootstrap');
    require('closestDescendant');

    validationElements = 'input:visible, select:visible, .validate:visible, ' +
        'textarea:visible, .validate-hidden, .generic-error-element';

    /**
     * Performs a breadth-first search on a node, returning all the child elements that contain the
     * "validation-name" data attribute along with the current node and it's name.
     * 
     * The resulting tree may have a _null root_ because the supplied element was not a
     * validation-name node itself, but a container for them.
     * 
     * This function is recursive and terminates once no more child nodes are found.
     * 
     * @private
     * @param {jQuery node} $element root element to begin the search.
     * @returns {} 
     */
    _gatherValidationNodesRecursive = function ($element, parent) {
        var output,
            children,
            $childNodes,
            nameGroups;

        output = {};
        children = [];
        parent = parent || null;
        $childNodes = $element.closestDescendant('[data-validation-name]', true);

        //remove tt-hint elements for typeahead so that the nodes are not duplicated
        $childNodes = _.filter($childNodes, function (cn) {
            return !$(cn).hasClass('tt-hint');
        });
        // Find child validation-names nodes (disregarding any superfluous HTML nesting),
        // and then repeat the process for each of them.
        _.each($childNodes, function (cn) {
            children.push(_gatherValidationNodesRecursive($(cn), output));
        });

        // Convert duplicated names of children into indexed names, as well as any
        // children that are explicitly suffixed to be an array.

        nameGroups = _.groupBy(children, 'name');

        _.each(nameGroups, function (ng) {
            var i,
                idx;

            idx = ng[0].name.indexOf('[]');
            if (ng.length > 1) {
                for (i = 0; i < ng.length; i++) {

                    idx = ng[i].name.indexOf('[]');

                    if (idx !== -1) {
                        ng[i].indexed_name = ng[i].name.substring(0, idx) + '[' + i + ']';
                    } else {
                        ng[i].indexed_name = ng[i].name + '[' + i + ']';
                    }
                }
            } else {
                // Name is just an array; in which case, set the indexed name manually.
                if (ng[0].name === '[]') {
                    ng[0].indexed_name = '[0]';
                } else if (idx !== -1) {
                    ng[0].indexed_name = ng[0].name.substring(0, idx) + '[0]';
                }
            }
        });

        output.$el = $element;
        output.name = $element.attr('data-validation-name') || null;
        output.indexed_name = output.name;
        output.children = children;
        output.parent = parent;

        return output;
    };

    /**
     * Returns one or more validation nodes given a root element and the string path.
     * 
     * @param {} $element 
     * @param {} path 
     * @returns {Array} an array of nodes.
     */
    _getValidationNodesForPath = function ($element, path) {
        var parts,
            graph,
            output,
            currentPart,
            candidateNodes,
            nextCandidateNodes,
            currentPath,
            matchesPart,
            matchesPath,
            i,
            j;

        parts = path.split('.');
        graph = _gatherValidationNodesRecursive($element);
        candidateNodes = nextCandidateNodes = graph.children;
        output = [];

        while (parts.length) {
            currentPath = parts.join('.');
            currentPart = parts.shift();

            // We use two arrays in ping-pong manner here; each for-loop iteration writes to the |nextCandidateNodes|.
            candidateNodes = nextCandidateNodes;
            nextCandidateNodes = [];

            for (i = 0; i < candidateNodes.length; i++) {
                matchesPart = _.indexOf([candidateNodes[i].name, candidateNodes[i].indexed_name], currentPart) !== -1;
                matchesPath = _.indexOf([candidateNodes[i].name, candidateNodes[i].indexed_name], currentPath) !== -1;

                if (matchesPart || matchesPath) {
                    if (!parts.length || matchesPath) { // Last element? If so, we've found our actual node.
                        output.push(candidateNodes[i]);
                    } else { // Keep searching for next child nodes.
                        for (j = 0; j < candidateNodes[i].children.length; j++) {
                            nextCandidateNodes.push(candidateNodes[i].children[j]);
                        }
                    }
                }
            }
        }

        return output;
    };

    /**
     * Returns an array of the form validation paths which have a data-validation-name attribute.
     * 
     * Each entry contains the jQuery $el property to that node, as well as the path of data-validation-names of
     * parents leading to that node (child->parent order).
     * 
     * @param {} $element 
     * @returns {} 
     */
    getNamedValidationPaths = function ($element) {
        var graph,
            paths,
            leafs,
            i,
            parent,
            children,
            remove,
            pathEntry,
            add;

        graph = _gatherValidationNodesRecursive($element);

        paths = [];
        leafs = [];

        // Flatten the graph, extracting _only_ the leaf nodes.

        children = graph.children;

        do {
            remove = [];
            add = [];

            _.each(children, function (c) {
                _.each(c.children, function (cc) {
                    add.push(cc);
                });

                if (c.children.length === 0) {
                    leafs.push(c);
                }

                remove.push(c);
            });//ignore jslint -- function within loop

            children = _.difference(children, remove);
            children = _.union(children, add);

        } while (children.length !== 0);

        for (i = 0; i < leafs.length; i++) {
            pathEntry = {
                $el: leafs[i].$el,
                path: [leafs[i].indexed_name],
                raw_path: [leafs[i].name]
            };

            parent = leafs[i].parent;

            while (parent !== null && parent.name !== null) {
                pathEntry.path.push(parent.indexed_name);
                pathEntry.raw_path.push(parent.name);
                parent = parent.parent;
            }

            pathEntry.path.reverse();
            pathEntry.raw_path.reverse();

            paths.push(pathEntry);
        }

        return paths;
    };

    /**
     * Given a ruleset object, traverses the $element hierarchy and creates attributes at
     * elements where required.
     * 
     * @param {jQueryNode} $element root node
     * @param {Object} ruleset the ruleset to apply
     */
    createValidationAttributesFromRuleset = function ($element, ruleset) {
        var paths,
            rule,
            path,
            validationNodes,
            value,
            $messageEls,
            i,
            j,
            k;

        paths = getNamedValidationPaths($element);

        //hide all elements that have validate-hide data attribute
        $element.find('[data-validate-hide-if-not-present="true"]').hide();

        if (!ruleset) {
            return;
        }
        for (i = 0; i < ruleset.length; i++) {
            rule = ruleset[i];

            path = rule.PropertyPath;

            validationNodes = _getValidationNodesForPath($element, path);

            //uncover the hidden element if validation rule is present
            /*ignore jslint start*/
            _.each(validationNodes, function (emp) {
                emp.$el.closest('[data-validate-hide-if-not-present="true"]').show();
                emp.$el.parents('[data-validate-hide-if-not-present="true"]').show();
            });
            /*ignore jslint end*/

            // With all matching nodes found, we can now append the rule attributes onto them.
            for (j = 0; j < rule.Rules.length; j++) {
                switch (rule.Rules[j].ValidationType) {
                case 'RequiredDefault':
                    // For display purposes only - no validation yet.
                    for (k = 0; k < validationNodes.length; k++) {
                        value = rule.Rules[j].Properties.DefaultValue;
                        if (typeof (value) === "object") {
                            if (value.Amount) {
                                value = value.Amount;
                            }
                            if (value.Name) {
                                value = value.Name;
                            }
                        }
                        validationNodes[k].$el.attr('placeholder', value);
                    }
                    break;

                case 'Required':
                    for (k = 0; k < validationNodes.length; k++) {
                        validationNodes[k].$el.data('validate-required', 'true');
                    }
                    break;

                case 'ReadOnlyValidator':
                    for (k = 0; k < validationNodes.length; k++) {
                        var $el = validationNodes[k].$el; //ignore jslint
                        if ($el.is("select") || $el.is(':checkbox') || $el.is(':radio')) {
                            $el.attr('disabled', 'disabled');
                            $el.data('serialize-disabled', true);
                        } else {
                            $el.attr('readonly', 'readonly');
                        }
                    }
                    break;

                case 'Message':
                    for (k = 0; k < validationNodes.length; k++) {
                        $messageEls = validationNodes[k].$el.closestDescendant('[data-validate-message="true"]');
                        $messageEls.data('content', rule.Rules[j].Properties.Message);
                    }
                    break;

                case 'MoneyRange':
                case 'DollarRange':
                    for (k = 0; k < validationNodes.length; k++) {
                        validationNodes[k].$el.data('validate-value-min', rule.Rules[j].Properties.Minimum.Amount);
                        validationNodes[k].$el.data('validate-value-max', rule.Rules[j].Properties.Maximum.Amount);
                    }
                    break;

                case 'MinLength':
                    for (k = 0; k < validationNodes.length; k++) {
                        validationNodes[k].$el.data('validate-length-min', rule.Rules[j].Properties.Length);
                    }
                    break;

                case 'MaxLength':
                    for (k = 0; k < validationNodes.length; k++) {
                        validationNodes[k].$el.data('validate-length-max', rule.Rules[j].Properties.Length);
                    }
                    break;
                }
            }
        }
    };

    /**
     * Creates a set of errors given a ValidationResult object.
     * 
     * @param {jQueryNode} element the element to search under
     * @param {Array} results the ValidationResult array
     */
    createErrorFromValidationResults = function ($element, results, renderOpts) {
        var i,
            name,
            paths,
            errorNode,
            errorResults;

        errorResults = results;

        paths = getNamedValidationPaths($element);

        // Now that we have all the elements indexed, we can match them up with the ValidationResult names
        // and highlight the element box.

        for (i = 0; i < errorResults.length; i++) {
            name = errorResults[i].MemberNames[0];

            errorNode = _.find(paths, function (p) {
                if (name) {
                    return p.path.join('.') === name;
                }

                return p.path[0] === 'GenericError';
            });//ignore jslint - function within loop

            if (errorNode) {
                clearError(errorNode.$el);
                createError(errorNode.$el, errorResults[i].ErrorMessage);
            } else {
                //
                // If an element cannot be found, bubble the message up using the standard Error Manager approach.
                //
                errorManager.appendError(401, {
                    IsInline: false,
                    IsSupportRequestEnabled: false,
                    ValidationMessages: results
                }, renderOpts);
            }
        }
    };

    createError = function (element, message) {
        var $error, toolTipPlacement, $errorElement;

        if (element.data('validate-error-element') !== undefined) {
            $errorElement = element.parents('form').find(element.data('validate-error-element'));
        } else {
            $errorElement = element;
        }

        $errorElement.addClass("validation-error-element");

        if (element.data('validate-use-tooltip') !== undefined && element.data('validate-use-tooltip') === true) {
            if (element.data('validate-tooltip-placement') !== undefined) {
                toolTipPlacement = element.data('validate-tooltip-placement');
            } else {
                toolTipPlacement = 'right';
            }

            $errorElement.tooltip({
                'title': message,
                'placement': toolTipPlacement,
                'trigger': 'hover focus'
            }).tooltip('show');
        } else {
            $error = $('<div />',
                {
                    'class': "help-block validation-error",
                    text: message
                });
            if ($errorElement.parents('.input-group').length) {
                $errorElement.parents('.input-group').before($error);
            } else {
                $errorElement.before($error);
            }
        }
    };

    clearError = function (element) {

        var $errorElement;

        if (element.data('validate-error-element') !== undefined) {
            $errorElement = element.parents('form').find(element.data('validate-error-element'));
        } else {
            $errorElement = element;
        }

        $errorElement.removeClass("validation-error-element");

        if (element.data('validate-required-range')) {
            $(element.data('validate-required-range')).removeClass("validation-error-element");
        }

        if (element.data('validate-use-tooltip') !== undefined && element.data('validate-use-tooltip') === true) {
            $errorElement.siblings('.tooltip').remove();
            $errorElement.tooltip('destroy');
        } else {
            if ($errorElement.parents('.input-group').length) {
                $errorElement.parents('.input-group').siblings(".validation-error").remove();
            } else {
                $errorElement.siblings(".validation-error").remove();
            }
        }
    };

    /* Set data attribute data-validateName on the element $el to boolean value*/
    setValidator = function ($el, validateName, value) {
        $el.data(validateName, value);
    };

    /* Remove data attribute data-validateName from the element $el */
    removeValidator = function ($el, validateName) {
        $el.removeData(validateName);
    };

    regularExpressions = {
        Date:    /^(0[1-9]|[12][0-9]|3[01])[\/](0[1-9]|1[012])[\/](19|20)\d\d$/,
        DateMDY: /^(0[1-9]|1[012])[\/](0[1-9]|[12][0-9]|3[01])[\/](19|20)\d\d$/,
        Phone: /^([\-. \(\)+]*\d){10,20}$/,
        ZipCode: /^[0-9]{5}(-[0-9]{4})?$/,
        // Postal: A1A-1A1 A1A1A1 A1A 1A1
        PostalCode: /[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]\d[a-zA-Z] *\d[a-zA-Z]\d$/, //ignore jslint
        //RFC Compatible regex
        Email: /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/, //ignore jslint
        Alphanumeric: /^[a-zA-Z0-9]*$/,
        nameValidation: /[a-zA-Z\s\-\'\.\,]/g,
        Price: /^(\d*([.,](?=\d{3}))?\d+)+((?!\2)[.,]\d\d)?$/,
        // credit card regex
        Mastercard: /^5[1-5]\d{14}$/,
        Visa: /^4\d{15}$/,
        Amex: /^3[47]\d{13}$/,
        CarteBlanche: /^30[0-5]\d{11}$/,
        JCB: /^(352[89]|35[3-8][0-9])\d{12}$/,
        DinersClub: /^(309|36[0-9]|3[89]0-9)\d{11}$/,
        // Frank - Discover regular expression found here
        // http://stackoverflow.com/questions/13500648/regex-for-discover-credit-card
        Discover: /^(6011\d{12}|65\d{14}|64[4-9]\d{13}|622(1(2[6-9]|[3-9]\d)|[2-8]\d{2}|9([01]\d|2[0-5]))\d{10})$/,
        TwelveHourTime: /(1[0-2]|[1-9]):([0-5][0-9])/
    };

    filterInt = function (value) {
        if (/^\-?([0-9]+|Infinity)$/.test(value)) {
            return Number(value);
        }
        return NaN;
    };

    filterFloat = function (value) {
        if (/^\-?([0-9]+(\.[0-9]+)?|Infinity)$/
                .test(value)) {
            return Number(value);
        }
        return NaN;
    };

    validators = {
        "required": function ($el, value) {
            if (value === null || value.trim() === '' || ($el.prop('type') === 'checkbox' && !$el.is(':checked'))) {
                createError($el, "This field is required");
                return false;
            }
            return true;
        },
        "alphanumeric": function ($el, value) {
            if (!regularExpressions.Alphanumeric.test(value.trim())) {
                createError($el, "This field only accepts alphanumeric values.");
                return false;
            }
            return true;
        },
        "name-characters": function ($el, value) {
            var nameCheck,
                name,
                nameLength,
                regexCheck;

            regexCheck = regularExpressions.nameValidation;

            name = value;
            nameLength = name.length;

            nameCheck = name.match(regexCheck);

            if (nameCheck === null) {
                nameCheck = [];
            }

            if (nameCheck.length !== nameLength) {
                createError($el,
                        "The following characters are allowed: letters, dashes (-), " +
                        "apostrophes ('), periods (.), and commas (,)");
                return false;
            }

            return true;
        },
        "value-not": function ($el, value, not) {
            if (value && value == not) { //ignore jslint
                createError($el, "You must select a different value for this field");
                return false;
            }
            return true;
        },
        "length": function ($el, value, length) {
            if (value.length !== length) {
                if ($el.data('validate-is-int') || $el.data('validate-is-num')) {
                    createError($el, 'This field must be ' + length + ' digits long');
                } else {
                    createError($el, "This field must be " + length + " characters long");
                }
                return false;
            }
            return true;
        },
        "length-min": function ($el, value, min) {
            if (value.length < min) {
                createError($el, "This field must be at least " + min + " characters long");
                return false;
            }
            return true;
        },
        "length-max": function ($el, value, max) {
            if (value.length > max) {
                createError($el, "This field can only contain up to " + max + " characters");
                return false;
            }
            return true;
        },
        "value-min": function ($el, value, min) {
            if (this['is-num']($el, value)) {
                if (value < min) {
                    createError($el, "This field must have a value greater than " + min);
                    return false;
                }
            } else {
                return false;
            }
            return true;
        },
        "value-max": function ($el, value, max) {
            if (this['is-num']($el, value)) {
                if (value > max) {
                    createError($el, "This field must have a value less than " + max);
                    return false;
                }
            } else {
                return false;
            }
            return true;
        },
        "value-between": function ($el, value, range) {
            var betweenRange;
            if (this['is-num']($el, value)) {
                betweenRange = range.split(',');
                if ((filterFloat(value) < filterFloat(betweenRange[0])) ||
                        (filterFloat(value) > filterFloat(betweenRange[1]))) {
                    createError($el, 'This field must be between ' + betweenRange[0] +
                        ' and ' + betweenRange[1]);
                    return false;
                }
            } else {
                return false;
            }
            return true;
        },
        "is-int": function ($el, value) {
            if (isNaN(filterInt(value))) {
                createError($el, "This field must be a number");
                return false;
            }
            return true;
        },
        "is-num": function ($el, value) {
            if (isNaN(filterFloat(value))) {
                createError($el, 'This field must be a number');
                return false;
            }
            return true;
        },
        "is-price": function ($el, value) {
            if (!regularExpressions.Price.test(value)) {
                createError($el, "Invalid price, do not include currency");
                return false;
            }
            return true;
        },
        "selection-max": function ($el, value, max) {
            if (value.length > max) {
                createError($el, "There can only be " + max + " selections for this field");
                return false;
            }
            return true;
        },
        "date-min": function ($el, value, min) {
            min = min === "today" ? moment().format('DD/MM/YYYY') : min;
            if (moment(value, 'DD/MM/YYYY') < moment(min, 'DD/MM/YYYY')) {
                createError($el, "This date cannot be earlier than " + min);
                return false;
            }
            return true;
        },
        "date-min-mdy": function ($el, value, min) {
            min = min === "today" ? moment().format('MM/DD/YYYY') : min;
            if (moment(value, 'MM/DD/YYYY') < moment(min, 'MM/DD/YYYY')) {
                createError($el, "This date cannot be earlier than " + min);
                return false;
            }
            return true;
        },
        "date-max": function ($el, value, max) {
            max = max === "today" ? moment().format('MM/DD/YYYY') : max;
            if (moment(value, 'MM/DD/YYYY').isAfter(moment(max, 'MM/DD/YYYY'))) {
                createError($el, "This date cannot be after " + max);
                return false;
            }
            return true;
        },
        // minselector is the selector of the element to compare this date to
        "date-gte": function ($el, value, minselector) {
            var minVal;
            minVal = $($el.parents('form')[0]).find(minselector).val();
            if (moment(value, 'DD/MM/YYYY').isBefore(moment(minVal, 'DD/MM/YYYY'))) {
                createError($el, "This date cannot be before " + minVal);
                return false;
            }
            return true;
        },
        // minselector is the selector of the element to compare this date to
        "date-gte-mdy": function ($el, value, minselector) {
            var minVal;
            minVal = $($el.parents('form')[0]).find(minselector).val();
            if (moment(value, 'MM/DD/YYYY').isBefore(moment(minVal, 'MM/DD/YYYY'))) {
                createError($el, "This date cannot be before " + minVal);
                return false;
            }
            return true;
        },
        // maxselector is the selector of the element to compare this date to
        "date-lte": function ($el, value, maxselector) {
            var maxVal;
            maxVal = $($el.parents('form')[0]).find(maxselector).val();
            if (moment(value, 'DD/MM/YYYY').isAfter(moment(maxVal, 'DD/MM/YYYY'))) {
                createError($el, "This date cannot be after " + maxVal);
                return false;
            }
            return true;
        },
        "date": function ($el, value) {
            if (!regularExpressions.Date.test(value)) {
                createError($el, "Please use the format: DD/MM/YYYY");
                return false;
            }
            return true;
        },
        "date-mdy": function ($el, value) {
            if (!regularExpressions.DateMDY.test(value)) {
                createError($el, "Please use the format: MM/DD/YYYY");
                return false;
            }
            return true;
        },
        "date-valid": function ($el, value) {
            if (!regularExpressions.Date.test(value) && (value.length > 0)) {
                createError($el, "Please use a valid date in the format: DD/MM/YYYY");
                return false;
            }
            return true;
        },
        "combodate-valid": function ($el, value) {
            var $comboDate, valLength, errMsg,
                $day, $mon, $year, day, mon, year, adjMon;
            errMsg = 'Please use a complete and valid date in the format: DD/MM/YYYY';
            if (!regularExpressions.Date.test(value) && (value.length > 0)) {
                createError($el, errMsg);
                return false;
            }

            // WoDo - wjc - the date format issue causes super jankiness here :(
            $comboDate = $el.next(".combodate");

            $day = $comboDate.find(".day");
            $mon = $comboDate.find(".month");
            $year = $comboDate.find(".year");

            day = ($day.val() === '' || $day.val() === null) ? 0 : $day.val().length;
            mon = ($mon.val() === '' || $mon.val() === null) ? 0 : $mon.val().length;
            year = ($year.val() === '' || $year.val() === null) ? 0 : $year.val().length;

            valLength = day + mon + year;

            adjMon = parseInt($mon.val(), 10) + 1;
            value = $day.val() + '/' +
                adjMon + '/' +
                $year.val();
            if (!regularExpressions.Date.test(moment(value, 'D/M/YYYY').format('DD/MM/YYYY')) &&
                    (valLength > 0)) {
                createError($el, errMsg);
                return false;
            }
            return true;
        },
        "twelve-hour-time": function ($el, value) {
            if (!regularExpressions.TwelveHourTime.test(value)) {
                createError($el, "Please enter a valid 12 hour time");
                return false;
            }
            return true;
        },
        /**
        * make sure to put "validate-hidden" class and attribute type="hidden" on the element 
        * for validate to interpret it; if dob is required, apply "required" class to the input element
        **/
        "dob": function ($el) {
            var $comboDate, cdvalue, today, unixValue,
                day, month, year;

            clearError($el.parent());
            clearError($el.parent().parent());

            $comboDate = $el.next(".combodate");

            day = $comboDate.find(".day").val();
            month = $comboDate.find(".month").val();
            year = $comboDate.find(".year").val();

            if (!day && !month && !year) {
                if ($el.hasClass('required')) {
                    createError($el.parent(), 'This field is required');
                    return false;
                }
                return true;
            }
            if (!day || !month || !year) {
                createError($el.parent(), 'Date of birth is incomplete');
                return false;
            }
            cdvalue = moment($el.combodate('getValue'));

            today = moment().unix();
            unixValue = cdvalue.unix();
            if (unixValue > today) {
                createError($el.parent(), 'Date of birth must be no later than today');
                return false;
            }

            return true;
        },
        "max-selected": function ($el, value, max) { //ignore jslint
            var group, count;
            group = $el.data('validation-max-selected-group');
            count = $($el.parents('form')[0]).find('[data-validation-max-selected-group="' +
                group + '"]:checked').length;
            if ((count > max) && ($el.is(':checked'))) {
                createError($el, 'Please select only ' + max + ' choice(s)');
                return false;
            }
            return true;
        },
        "min-selected": function ($el, value, min) { //ignore jslint
            var group, count;
            group = $el.data('validation-min-selected-group');
            count = $($el.parents('form')[0]).find('[data-validation-min-selected-group="' +
                group + '"]:checked').length;
            if (count < min) {
                createError($el, 'Please select at least ' + min + ' choice(s)');
                return false;
            }
            return true;
        },
        "min-selected-button-top": function ($el, value, min) { //ignore jslint
            var group, count;
            group = $el.data('validation-min-selected-group');
            count = $($el.parents('form')[0]).find('[data-validation-min-selected-group="' +
                group + '"]:checked').length;
            if (count < min) {
                clearError($('.button_form_tooltip_error_single'));
                createError($('.button_form_tooltip_error_single:focus'),
                    'Please select at least ' + min + ' choice(s)');
                return false;
            }
            return true;
        },
        "required-range": function ($el, value, cssClass) { //ignore jslint
            var result = _.reduce($(cssClass), function (memo, val) {
                return memo + $(val).val();
            }, '').trim() !== '';

            if (!result) {
                createError($el, 'At least one input must have a value');
                $(cssClass).addClass('validation-error-element');
                return false;
            }

            return true;
        },
/*
       data-validate-file-extensions="jpg,jpeg,png,gif" 
       data-validate-file-extensions="pdf,doc,docx" 
       data-validate-file-extensions="pdf" 
*/
        "file-extensions": function ($el, value, extensions) { //ignore jslint
            var ext, extensionList;
            if (value.length > 0) {
                if ((value.lastIndexOf('.') === -1) ||
                        (value.lastIndexOf('.') === value.length - 1)) {
                    createError($el, "File must have a file extension");
                    return false;
                }
                ext = value.substr(value.lastIndexOf('.') + 1).toUpperCase();
                extensionList = extensions.toUpperCase().split(',');
                if (_.indexOf(extensionList, ext) === -1) {
                    createError($el, "File extension does not match accepted extension(s): " + extensions);
                    return false;
                }
            }
            return true;
        },
/*
       data-validate-max-file-size="50"
       data-validation-max-file-size-units="KB"
       data-validation-max-file-size-units="MB"
*/
        "max-file-size": function ($el, value, maxFileSize) { //ignore jslint
            var fileObj, fileSizeUnits, kb1, mb1, fileSize, fileSizeVal, fileSizeValMsg, fileSizeMsg;

            fileObj = $el.get(0);
            if (typeof (fileObj.files) !== 'undefined') { //ignore jslint

                fileSizeUnits = $el.data('validation-max-file-size-units');

                kb1 = 1024;
                mb1 = 1048576;
                fileSizeVal = mb1;
                fileSizeMsg = 'unspecified';
                fileSizeValMsg = 'unspecified';

                fileSize = fileObj.files[0].size;
                if (fileSizeUnits.toUpperCase() === 'KB') {
                    fileSizeVal = kb1 * parseInt(maxFileSize, 10);
                    fileSizeValMsg = maxFileSize + 'KB';
                    fileSizeMsg = (fileSize / kb1).toFixed(2) + 'KB';
                }
                if (fileSizeUnits.toUpperCase === 'MB') {
                    fileSizeVal = mb1 * parseInt(maxFileSize, 10);
                    fileSizeValMsg = maxFileSize + 'MB';
                    fileSizeMsg = (fileSize / mb1).toFixed(2) + 'MB';
                }

                if (fileSize > fileSizeVal) {
                    createError($el, 'File size (' + fileSizeMsg + ') must be less than or equal to ' + fileSizeValMsg);
                    return false;
                }
            }
            return true;
        },
        "email": function ($el, value) {
            if (!regularExpressions.Email.test(value.toLowerCase())) {
                createError($el, "This is not a valid email address");
                return false;
            }

            return true;
        },
        "email-list": function ($el, value) {
            var buffer = true;
            buffer = _.every(value.split(','), function (t) {
                return regularExpressions.Email.test(t);
            });

            if (!buffer) {
                createError($el, "At least one email address is not valid");
                return false;
            }

            return true;
        },
        "zipcode": function ($el, value) {
            if (!regularExpressions.ZipCode.test(value)) {
                createError($el, "This is not a valid zip code");
                return false;
            }

            return true;
        },
        "postalcode": function ($el, value) {
            if (!regularExpressions.PostalCode.test(value)) {
                createError($el, "This is not a valid postal code");
                return false;
            }

            return true;
        },
        "phone": function ($el, value) {
            clearError($el);
            if (!value) {
                // not a phone/fax
                return true;
            }
            value = value.replace('+1', '').replace(/[() .+-]/g, ''); //ignore jslint
            if (value.length < 10 || isNaN(value)) {
                createError($el, 'The number must be at least 10 digits long');
                return false;
            }
            return true;
        },
        "work-phone": function ($el, value) {
            var firstTen;

            if (!value) {
                // no work phone
                return true;
            }
            clearError($el);
            value = value.replace(/[() .-]/g, ''); //ignore jslint

            if (value.length < 10) {
                createError($el, 'The phone must be at least 10 digits');
                return false;
            }
            firstTen = value.substring(0, 10);
            if (isNaN(firstTen)) {
                createError($el, 'The phone must start with 10 digits');
                return false;
            }
            if (value.length > 32) {
                createError($el, 'The phone must be at most 32 digits');
                return false;
            }
            return true;
        },
        "creditcardtype-commission": function ($el, value) {
            // Frank: validation for the credit card
            // AmericanExpress, Visa, MasterCard, DinersClub, Discover, CarteBlanche and JCB
            // Scope: quotes with commission farecode
            var creditCardNumber;
            creditCardNumber = value.replace(/\s|-/g, '');  // Remove any white spaces and dashes

            if (!regularExpressions.Visa.test(creditCardNumber) &&
                    !regularExpressions.Amex.test(creditCardNumber) &&
                    !regularExpressions.Mastercard.test(creditCardNumber) &&
                    !regularExpressions.CarteBlanche.test(creditCardNumber) &&
                    !regularExpressions.JCB.test(creditCardNumber) &&
                    !regularExpressions.DinersClub.test(creditCardNumber) &&
                    !regularExpressions.Discover.test(creditCardNumber)) {
                createError($el, 'Credit card type or number is invalid, please try again');
                return false;
            }

            return true;
        },
        "creditcardtype-netrate": function ($el, value) {
            // Frank - validation for credit card
            // AmericanExpress, Visa and MasterCard
            // Scope: quotes with net rate farecode
            var creditCardNumber;
            creditCardNumber = value.replace(/\s|-/g, '');  // Remove any white spaces and dashes

            if (!regularExpressions.Visa.test(creditCardNumber) &&
                    !regularExpressions.Amex.test(creditCardNumber) &&
                    !regularExpressions.Mastercard.test(creditCardNumber)) {
                createError($el, 'Credit card type or number is invalid, please try again');
                return false;
            }

            return true;
        },
        "creditcardnumber": function ($el, value) {
            var creditCardNumber;
            creditCardNumber = value.replace(/\s|-/g, '');  // Remove any white spaces and dashes

            if (!regularExpressions.Visa.test(creditCardNumber) &&
                    !regularExpressions.Amex.test(creditCardNumber) &&
                    !regularExpressions.Mastercard.test(creditCardNumber) &&
                    !regularExpressions.CarteBlanche.test(creditCardNumber) &&
                    !regularExpressions.JCB.test(creditCardNumber) &&
                    !regularExpressions.DinersClub.test(creditCardNumber) &&
                    !regularExpressions.Discover.test(creditCardNumber)) {
                createError($el, 'Credit card type or number is invalid, please try again');
                return false;
            }

            return true;
        },
        "custom": function ($el, value, custom, message) {
            var customRegex = new RegExp(custom);
            if (!customRegex.test(value)) {
                if (message) {
                    createError($el, message);
                } else {
                    createError($el, "This field is not formatted correctly");
                }
                return false;
            }
            return true;
        }
    };

    resolveValidation = function (form, group) {
        var $form, validationResult, validationGroup;
        $form = $(form);
        validationResult = true;
        validationGroup = group || $form.data('validation-group');

        _.each($form.find(validationElements), function (x) {
            var $x = $(x),
                value,
                thisResult = true,
                i = 0,
                key = '',
                validations = [],
                vGroups = $x.data('validation-group') ? $x.data('validation-group').split(',') : undefined;

            if (_.filter(Object.keys($x.data()), function (v) {
                    return v.indexOf('validate') > -1;
                }).length > 0) {
                clearError($x);
            }

            if (validationGroup &&
                    (!vGroups
                        || (vGroups
                            && !_.find(vGroups, function (g) { return g.trim() === validationGroup; })))) {
                return;
            }

            if ($x.data('validate-ignore') !== undefined && $x.data('validate-ignore') === true) {
                return;
            }

            value = ($x.is('input') || $x.is('select') || $x.is('textarea')) ? $x.val() : $x.html();

            if ($x.data('validate-required')) {
                thisResult = validators.required($x, value);
                validationResult = validationResult && thisResult;
            }

            if (((value !== '' && value !== null) || ($x.data('validate-combodate-valid'))
                    || ($x.data('validate-dob'))) && thisResult) {
                validations = Object.keys(validators);
                for (i = 0; i < validations.length; i++) {
                    key = 'validate-' + validations[i];
                    if ($x.data(key)) {
                        validationResult = validators[validations[i]](
                            $x,
                            value,
                            $x.data(key),
                            $x.data('validate-custom-message')
                        ) && validationResult;
                    }
                }
            }
        });

        return validationResult;
    };

    clearAll = function (form) {
        var $form = $(form);
        _.map($form.find(validationElements), function (x) {
            var $x = $(x);
            clearError($x);
        });
    };

    exports.Validate = resolveValidation;
    exports.CreateError = createError;
    exports.CreateErrorFromValidationResults = createErrorFromValidationResults;
    exports.ClearError = clearError;
    exports.ClearAll = clearAll;
    exports.CreateValidationAttributesFromRuleset = createValidationAttributesFromRuleset;
    exports.SetValidator = setValidator;
    exports.RemoveValidator = removeValidator;
});