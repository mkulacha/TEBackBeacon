require.config({
    waitSeconds: 200,
    paths: {
        'jquery': 'Lib/jquery.min',
        'bootstrap': 'Lib/bootstrap.min',
        'jqueryui': 'Lib/jquery.ui',
        'jquerytouch': 'Lib/jquery.ui.touch-punch.min',
        'mustache': 'Lib/mustache.min',
        'underscore': 'Lib/lodash.min',
        'backbone': 'Lib/backbone-min',
        'moment': 'Lib/moment.min',
        'pnotify': 'Lib/pnotify',
        'datepicker': 'Lib/bootstrap-datepicker.min',
        'ckeditor': 'Lib/CKEditor/adapter/jqAdapter',
        'jTruncate': 'Lib/jquery.jtruncate',
        'toword': 'Lib/toword',
        'combodate': 'Lib/combodate',
        'flowplayer': 'Lib/flowplayer-3.2.13.min',
        'momentdurationformat': 'Lib/moment-duration-format',
        'accounting': 'Lib/accounting.min',
        'closestDescendant': 'Lib/closestDescendant',
        'vue': 'Lib/vue',
        'quill': 'Lib/quill.min'
    },
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        bootstrap: {
            deps: ['jquery']
        },
        mustache: {
            exports: 'Mustache'
        },
        pnotify: {
            deps: ['jquery', 'bootstrap']
        },
        datepicker: {
            deps: ['jquery', 'bootstrap']
        },
        ckeditor: {
            deps: ['Lib/ckeditor/ckeditor'],
            exports: 'CKEditor'
        },
        quill: {
            deps: ['jquery']
        },
        toword: {
            exports: 'toWord'
        },
        combodate: {
            deps: ['jquery', 'moment']
        },
        jqueryui: {
            deps: ['jquery']
        },
        jTruncate: {
            deps: ['jquery']
        },
        jquerytouch: {
            deps: ['jquery', 'jqueryui']
        },
        closestDescendant: {
            deps: ['jquery']
        }
    }
});

define(['jquery', 'app/common', 'app/notify',
    'app/widget/quick.search.widget',  'quill', 'jquerytouch'],
    function ($, common, notify, QuickSearchWidget, quill) {
        $(document).ready(function () {
            var qsWidget,
                quillFontAttribute;

            common.Initialize();
            notify.Initialize();

            qsWidget = new QuickSearchWidget();

            quillFontAttribute = quill.import('attributors/style/font');//ignore jslint
            quillFontAttribute.whitelist = [
                'Arial',
                'Comic Sans MS',
                'monospace',
                'Georgia',
                'Lucida Sans Unicod',
                'Tahoma',
                'cursive'];

            quill.register(quillFontAttribute, true);
            quill.register(quill.import('attributors/style/size'), true);//ignore jslint
            quill.register(quill.import('formats/font'), true);//ignore jslint

            $('#quick-search-dashboard-widget').html(qsWidget.$el());
        });
    });