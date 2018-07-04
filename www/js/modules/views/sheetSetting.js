/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    require('js/modules/manager/fastSheetConfig');
    var App = {
        init: function () {
            var sheetConfig = {
                rows:Core.Cache.get('SheetTmpl')
            };
            new Vue({
                el: '#fastKpPage',
                data: sheetConfig,
                methods: {
                    save: function () {
                        Core.Cache.set('SheetTmpl',sheetConfig.rows);
                    }
                }
            });
            $('.list-block').removeClass('hide');
        }
    };
    Core.init(App);
    module.exports = App;
});