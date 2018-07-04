/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var sheetNo;
    var attributes = Core.Cache.get('attributes');
    module.exports = {
        getSheet: function () {
            var sheet = Core.Cache.get('lastSaveSheet');
            if (!sheet) {
                native.showToast("运单号不存在!");
                Core.Page.back();
                return false;
            }
            sheetNo = sheet['sheetNo'];
            Core.Service.get('api/auth/v1/ltl/sheet/getSheetDetail', {
                sheetNo: sheetNo
            }, function (result) {
                var sheetView = result['data']['sheetView'];
                Core.Cache.set('lastSheet', sheetView);

                if (attributes['id'] == sheetView['salesmanId']) {
                    $('.edit').removeClass('hide');
                }
                var html = Core.Template.render('sheetMoreDetailTmpl', result['data']);
                $("#sheetMoreDetail .detail").html(html);
            });
        }
    };
});