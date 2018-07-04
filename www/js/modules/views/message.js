/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var $vue;
    var App = {
        init: function () {
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    messages: Core.Cache.get("messages") || []
                },
                methods: {}
            });
            this.initEvents();
        },
        getMessage: function () {
            $vue.messages = Core.Cache.get("messages") || []
        },
        initEvents: function () {
            $('body').on('refresh', '.page-content', function () {
                App.getMessage();
                Core.App.pullToRefreshDone();
            });
        }
    };
    Core.init(App);
    module.exports = App;
});