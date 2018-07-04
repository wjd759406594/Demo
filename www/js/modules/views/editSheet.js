/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var $sheetConfig = require('js/modules/manager/offlineSheetConfig');
    var sheet;
    var App = {
        init: function () {
            console.log("修改运单初始化");
            Core.App.hidePreloader();
            var isReturn = getUrlParam("isReturn") || "";
            if (isReturn) {
                sheet = Core.Cache.get('lastReturnSheet');
                $("#title").text("原单返回");
            } else {
                sheet = Core.Cache.get('lastSaveSheet');
                $("#title").text("修改运单");
            }
            if (!sheet) {
                native.showToast("运单不存在!");
                Core.Page.back();
                return false;
            }
            $sheetConfig.editSheet(sheet,true);
        },
        refresh: function () {
            App.init(true);
        }
    };
    Core.init(App);
    module.exports = App;
});