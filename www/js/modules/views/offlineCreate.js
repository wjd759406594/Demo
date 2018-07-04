define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var lxDb = Core.lxDb;
    var $sheet;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            $sheet = require('js/modules/manager/offlineSheetConfig');
            //sheetNoManual
            $sheet.editSheet();
        }
    };
    Core.init(App);
    module.exports = App;
});