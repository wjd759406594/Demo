/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    // var native = require("js/modules/hybridapi");
    var Core = require('js/modules/core/core');
    var $sheet;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            $sheet = require('js/modules/manager/sheetConfig');
            $sheet.editSheet($sheet.getSheetObj());
            $sheet.initToOrgArea();
            $sheet.initFromShop();
            $sheet.initFromCustomer(true);
            var order = Core.Cache.get('lastOrder');
            if (order) {
                $sheet.initPreOrder(order);
            }
        },
        refresh: function () {
            $sheet.updateSheetTmpl();
        }
    };
    window.refresh = App.refresh;
    window.App = App;
    Core.init(App);
    module.exports = App;
});