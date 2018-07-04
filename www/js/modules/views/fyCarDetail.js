/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var attributes = Core.Cache.get('attributes');
    var native = require('js/modules/hybridapi');
    var companyNo = Core.Cache.get('companyNo');
    var laytpl = require('js/modules/core/laytpl');
    var analytics = require('js/modules/core/analytics');

    var loadShift;
    var $vue;
    var App = {
        init: function () {
            console.log("初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    loadShift: {},
                    loadSheet: {},
                    sheetList: [],
                    checkAll: false,
                    checkSheetList: [],
                    remark: ""
                },
                watch: {
                    checkAll: function (val) {
                        if (val) {
                            App.checkAll();
                        } else {
                            $vue.checkSheetList = [];
                        }
                    }
                },
                computed: {
                    total: function () {
                        var totalGoodsAmount = 0;
                        var totalFee = 0;
                        var totalCod = 0;
                        this.sheetList.map(function (s) {
                            totalGoodsAmount += s['goodsAmount'];
                            totalFee += s['totalFee'];
                            totalCod += s['cod'];
                        });
                        return {
                            "totalGoodsAmount": totalGoodsAmount,
                            "totalFee": totalFee,
                            "totalCod": totalCod
                        }
                    }
                },
                methods: {
                    batchPrint: function () {
                        App.batchPrint();
                    },
                    print: function (sheetView) {
                        App.print(sheetView);
                    },
                    showDetail: function (sheetNo) {
                        Core.Cache.set('sheetNo', sheetNo);
                        Core.Page.changePage('sheetDetail.html', true);
                    },
                    uploadExcept: function (sheet) {
                        Core.Cache.set("exceptionSheet", sheet);
                        Core.Page.changePage('exceptionReport.html', true);
                    },
                    pickUp: function (sheet) {
                        Core.Cache.set('lastPickupSheet', sheet);
                        Core.Page.changePage("pickupDetail.html", true);
                    },
                    arrive: function () {

                        analytics.onClickEvent(0x303000C);
                        Core.App.confirm("确认到达并自动卸车吗?", function () {
                            Core.Service.post('api/auth/v1/ltl/loadShiftOrg/arriveAndUnload', {
                                loadShiftId: $vue.loadShift.loadShiftId,
                                shopId: $vue.loadShift.shopId
                            }, function () {
                                native.showToast('到达卸车成功');
                                $vue.loadShift.isArrive = 1;
                            });
                        });
                    }
                }
            });
            this.initEvents();
            this.loadSheet();
        },
        getBatchKey: function () {
            return Core.ScanType.zc + "_" + $vue.shift['id'] + "_" + $vue.shift['shopId'];
        },
        loadSheet: function () {
            $vue.sheetList = [];
            $vue.checkSheetList = [];
            loadShift = Core.Cache.get('loadShift');
            $vue.loadShift = loadShift;
            if (!loadShift) {
                native.showToast("页面参数不正确");
                Core.Page.back();
                return false;
            }
            switch (loadShift.type) {
                case "arrive":
                    Core.Service.get('api/auth/v1/ltl/loadShiftSheet/findArriveSheetViewList', {
                        loadShiftId: loadShift['loadShiftId'],
                        arriveShopId: loadShift['shopId']
                    }, function (result) {
                        if (result['data'].length > 0) {
                            $vue.sheetList = result['data'];
                            App.checkAll();
                        } else {
                            native.showToast("该线路没有装车运单");
                        }
                    });
                    break;
                case "task":
                    Core.Service.get('api/auth/v1/ltl/deliverySheet/findByDeliveryTaskId', {
                        deliveryTaskId: loadShift['id']
                    }, function (result) {
                        if (result['data'].length > 0) {
                            $vue.sheetList = result['data'];
                            App.checkAll();
                        } else {
                            native.showToast("没有装车运单");
                        }
                    });
                    break;
                default:
                    Core.Service.get('api/auth/v1/ltl/loadShiftSheet/findLoadedSheetViewList', {
                        loadShiftId: loadShift['id'],
                        sendShopId: loadShift['shopId']
                    }, function (result) {
                        if (result['data'].length > 0) {
                            $vue.sheetList = result['data'];
                            App.checkAll();
                        } else {
                            native.showToast("该线路没有装车运单");
                        }
                    });
                    break;
            }
        },
        checkAll: function () {
            $.each($vue.sheetList, function (i, v) {
                $vue.checkSheetList.push(v['sheetNoShort']);
            });
            $vue.checkAll = true;
        },
        print: function (sheetView) {
            Core.App.alert('print 2', function () {
                var print = Core.Utils.getPrintSetting('WaybillBq');
                if (print) {
                    var deviceType = Core.Utils.getDeviceType(print);
                    var configName = Core.Utils.getPrintTemplateName(2);
                    var WaybillCount = Core.Cache.get('WaybillCount');
                    Core.Utils.getPrintTemplate(configName, deviceType, function (result) {
                        var tpl = result['content'];
                        var html = laytpl(tpl).render(sheetView);
                        native.print(print['address'], deviceType, 1, WaybillCount, html);
                    });
                }
            });
        },
        batchPrint: function () {
            if ($vue.checkSheetList.length == 0) {
                native.showToast('请选择要打印的运单');
                return false;
            }
            var print = Core.Utils.getPrintSetting();
            if (print) {
                var deviceType = Core.Utils.getDeviceType(print);
                var configName = Core.Utils.getPrintTemplateName(2);
                var WaybillCount = Core.Cache.get('WaybillCount');
                var printList = [];
                Core.Utils.getPrintTemplate(configName, deviceType, function (result) {
                    var tpl = result['content'];
                    $.each($vue.sheetList, function (i, v) {
                        if ($vue.checkSheetList.indexOf(v['sheetNoShort']) > -1) {
                            console.log(laytpl(tpl).render(v));
                            printList.push({
                                start: 1,
                                end: WaybillCount,
                                html: window.Base64.encode(laytpl(tpl).render(v))
                            });
                        }
                    });
                    native.printList(print['address'], deviceType, printList);
                });
            }
        },
        initEvents: function () {

        }
    };
    window.refresh = App.loadSheet;
    Core.init(App);
    module.exports = App;
});