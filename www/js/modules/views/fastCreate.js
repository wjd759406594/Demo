/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var analytics = require('js/modules/core/analytics');

    var $sheet;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            $sheet = require('js/modules/manager/fastSheetConfig');
            $sheet.editSheet();
            $sheet.initToOrgArea();
            $sheet.initFromShop();
            $sheet.initFromCustomer(true);
            var order = Core.Cache.get('lastOrder');
            if (order) {
                $sheet.initPreOrder(order, false);
                Core.Cache.remove('lastOrder');
            }
            analytics.onPageEvent(0x2030002);

        }
    };
    Core.init(App);
    module.exports = App;
});