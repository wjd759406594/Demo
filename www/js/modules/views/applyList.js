/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var native = require("js/modules/hybridapi");
    var Core = require('js/modules/core/core');
    var $vue;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    type: "",
                    applyList: [],
                    sheetList: []
                },
                watch: {},
                methods: {
                    findApplyList: function (type) {
                        $vue.type = type;
                        App.findApplyList();
                    },
                    showDetail: function (item) {
                        $vue.sheetList = [];
                        Core.Service.get('api/auth/v1/sap/consumerTrade/findSheetListByApply', item, function (result) {
                            Core.Page.changePageName('sheetList');
                            $vue.sheetList = result['data']['rows'] || [];
                        });
                    },
                    showSheet: function (sheetNo) {
                        Core.Cache.set('sheetNo', sheetNo);
                        Core.Page.changePage('sheetDetail.html', true);
                    },
                    applyCodFee: function (item) {
                        Core.App.confirm("确认申请充值", function () {
                            Core.Service.post('api/auth/v1/sap/consumerTrade/applyCodFee', item, function () {
                                native.showToast("提交申请成功");
                                App.findApplyList();
                            });
                        })
                    }
                }
            });
            this.initEvent();
            this.findApplyList();
        },
        initEvent: function () {
            $('body').on('refresh', "#applyList .pull-to-refresh-content", function () {
                App.findApplyList();
            }).on('click', '.panel a', function () {
                if ($(this).data('name') != $vue.title) {
                    Core.Cache.set('reportParam', {
                        api: $(this).data('val'),
                        name: $(this).data('name'),
                        detailApi: $(this).data('detail')
                    });
                    App.initLineChart();
                }
            });
        },
        findApplyList: function (type) {
            Core.Service.get('api/auth/v1/sap/consumerTrade/findApplyList', {type: $vue.type}, function (results) {
                $vue.applyList = results['data']['rows'] || [];
            });
        }
    };
    window.App = App;
    // window.refresh = App.findApplyList;
    Core.init(App);
    module.exports = App;
});