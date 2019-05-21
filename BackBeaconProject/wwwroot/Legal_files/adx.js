/**
 * Contains all the commonly used ADX components bundled in one file - for all your inclusionary pleasures.
 **/
define(function (require) {
    return {
        Request:    require('app/request'),
        Enums:      require('app/enumtypes'),
        Track:      require('app/track'),
        Common:     require('app/common'),
        Validate:   require('app/validate'),
        GeoTool:    require('app/toolbox/geo.tool'),
        Notify:     require('app/notify'),

        View:       require('app/core/view'),
        Model:      require('app/core/model'),
        Widget:     require('app/core/widget'),
        Api:        require('app/core/api')
    };
});
