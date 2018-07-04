/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var analytics = require('js/modules/core/analytics');

    var $dbInnerManager = require('js/modules/manager/dbInnerManager');
    var $vue;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            analytics.onPageEvent(0x2030007);

            $vue = new Vue({
                el: '#vueBound',
                data: {
                    pickupScanList: [],
                    name: ""
                },
                methods: {
                    add: function (validation) {
                        if (validation.invalid) {
                            native.showToast(validation["errors"][0].message);
                            return false;
                        }

                        var param = {
                            uuid: '',
                            name: $vue.name,
                            state: 0,
                            scanList: [],
                            createDate: (new Date()).Format("yyyy-MM-dd hh:mm:ss")
                        };
                        $dbInnerManager.addPickupScan(param, function () {
                            $vue.pickupScanList.unshift(param);
                            native.showToast("添加成功");
                            $vue.name = "";
                           //Core.Page.back();
                        });
                    },
                    remove: function (item) {
                        Core.App.confirm("确认删除当前提货批次(会清空本地全部扫码)", function () {
                            $dbInnerManager.removePickupScan(item.id, function () {
                                $vue.pickupScanList.$remove(item);
                            });
                        });
                    },
                    openScan: function (item) {
                        Core.Cache.set("lastPickupScan", item);
                        Core.Page.changePage('pickupScan.html', true);
                    },
                    clearList:function () {
                        Core.App.confirm("会清空已上传的本地数据", function () {
                            $dbInnerManager.clearPickupScan(function () {
                                 App.findpickupScanList();
                            });
                        });
                    }
                }
            });
            this.initEvents();
            this.findpickupScanList();
        },
        initEvents: function () {
           /* $("body").on('refresh', '#pickupScanList', function () {
                App.findpickupScanList();
            });*/
        },
        findpickupScanList: function () {
            //Core.App.showPreloader();
            $vue.$data.batchNo = guid();
            $dbInnerManager.findPickupScanList(function (result) {
                $vue.pickupScanList = result;
                /*setTimeout(function () {
                    Core.App.hidePreloader();
                    Core.App.pullToRefreshDone();
                }, 300);*/
            });
        }
    };
    Core.init(App);
    window.refresh = App.findpickupScanList;
    module.exports = App;
});