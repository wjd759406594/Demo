/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var $ = window.$;
    var _ = window._;
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var $dbInnerManager = require('js/modules/manager/dbInnerManager');
    var analytics = require('js/modules/core/analytics');

    var sheetPre = Core.Cache.get('sheetPre');
    var scanDetail;
    var pickupScan;
    var $vue;
    var block = false;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    sheetNo: "",
                    pickupScanInfo: {},
                    scanList: [],
                    cod: 0,
                    pickTotalFee: 0
                },
                computed: {},
                watch: {
                    scanList: function () {
                        App.countFee();
                    }
                },
                methods: {
                    sendScan: function () {
                        var that = this;
                        if (that.scanList.length == 0) {
                            native.showToast('没有任何扫码');
                            return false;
                        }
                        Core.App.confirm("是否确认上传?", function () {
                            analytics.onClickEvent(0x303000F);
                            var tmp = [];
                            $.each(that.scanList, function (i, v) {
                                tmp.push(v['sheetNo']);
                            });
                            console.log(tmp);
                            Core.Service.post('api/auth/v1/ltl/pickup/scanPickup', {
                                sheetNos: tmp
                            }, function (result) {
                                var data = result['data'];
                                var scanResultList = result['data']['scanResultList'];
                                if (scanResultList.length > 0) {
                                    var message = "扫码上传成功,部分运单提货失败";
                                    $.each($vue.scanList, function (k, v) {
                                        $.each(scanResultList, function (k1, v1) {
                                            if (v1['s'] == v['sheetNo']) {
                                                v.state = "fail";
                                                v.message = v1['d'];
                                            }
                                        });
                                    });
                                    native.showToast(message);
                                } else {
                                    native.showToast("扫码上传成功");
                                }
                                $dbInnerManager.updatePickupScan(pickupScan.id, {
                                    scanList: $vue.scanList,
                                    state: 1,
                                    totalCod: data['totalCod'],
                                    totalPickupFee: data['totalPickupFee'],
                                    totalReceive: data['totalReceive']
                                }, function () {
                                    $vue.pickupScanInfo = {
                                        scanList: $vue.scanList,
                                        state: 1,
                                        totalCod: data['totalCod'],
                                        totalPickupFee: data['totalPickupFee'],
                                        totalReceive: data['totalReceive']
                                    };
                                });
                            });
                        });
                    },
                    removeScan: function (scan) {
                        var that = this;
                        Core.App.confirm("确定删除这条运单记录", '温馨提示', function () {
                            var tmp = JSON.parse(JSON.stringify($vue.scanList));
                            var obj = JSON.parse(JSON.stringify(scan));
                            console.log(tmp.length);
                            $.each(tmp, function (i, v) {
                                if (v['sheetNo'] == obj['sheetNo']) {
                                    tmp.remove(i);
                                    return false;
                                }
                            });
                            $dbInnerManager.updatePickupScan(pickupScan.id, {
                                scanList: tmp
                            }, function () {
                                that.scanList.$remove(scan);
                            });
                        });
                    },
                    addScan: function () {
                        if ($vue.sheetNo.length < sheetLength) {
                            native.showToast("请输入最少" + sheetLength + "运单号");
                            return false;
                        }
                        var time = (new Date()).Format("yyyy-MM-dd hh:mm:ss");
                        var params = {
                            createTime: time,
                            sheetNo: sheetPre + $vue.sheetNo
                        };
                        App.renderScanList(params);
                        $vue.sheetNo = "";
                        Core.Page.back();
                    }
                }
            });
            this.initEvent();
            this.initScanList();
            document.addEventListener('getScan', App.addScanFromNative, false);
        },
        initScanList: function () {
            pickupScan = Core.Cache.get("lastPickupScan");
            if (!pickupScan) {
                native.showToast("本地没有该批次的扫码");
                Core.Page.back();
                return false;
            }
            $vue.scanList = [];
            $dbInnerManager.findPickupScanById(pickupScan.id, function (result) {
                $vue.pickupScanInfo = result;
                $vue.scanList = result['scanList'];
            });
        },
        initEvent: function () {
            $("body").on('click', '.showScan', function () {
                scanDetail = $(this).data('val');
                Core.Page.changePage('scanDetail.html');
            });
        },
        /**
         * 客户的扫码事件
         * @param e
         * @returns {boolean}
         */
        addScanFromNative: _.throttle(function (e) {
            var sheetLabelNo = Core.Utils.getSheetNoFromScan(e.detail['sheetLabelNo']);
            if (sheetLabelNo === "") {
                return false;
            }
            var time = (new Date()).Format("yyyy-MM-dd hh:mm:ss");
            var sheetNo = sheetLabelNo.length > Core.Utils.getSheetFullLength() ? Core.Utils.getSheetNo(sheetLabelNo) : sheetLabelNo;

            var params = {
                createTime: time,
                sheetNo: sheetNo
            };
            App.renderScanList(params);
        },100),
        checkList: function (sheetNo) {
            var flag = false;
            if ($vue.scanList.length > 0) {
                $.each($vue.scanList, function (i, v) {
                    if (v['sheetNo'] === sheetNo) {
                        flag = true;
                        return false;
                    }
                });
            }
            if (flag) {
                native.mediaVibrate(Core.ScanCode.error, "重复扫码");
                block = false;
                return false;
            }
            return true;
        },
        /**
         * 选择本地扫码列表
         * @param params
         */
        renderScanList: function (params) {
            if (!params['sheetNo'].startsWith(sheetPre)) {
                native.mediaVibrate(Core.ScanCode.notRead, "不识别条码");
                return false;
            }
            if (!block) {
                block = true;
                if (!App.checkList(params['sheetNo'])) {
                    return false;
                }
                Core.Service.post('api/auth/v1/ltl/pickup/validatePickup', {
                    sheetNo: params['sheetNo'],
                    force: true
                }, function (result) {
                    if (result['data']) {
                        var sheet = result['data'];
                        sheet.state = 'success';
                        $vue.scanList.unshift(sheet);
                        $dbInnerManager.updatePickupScan(pickupScan.id, {
                            scanList: $vue.scanList
                        }, function () {
                            block = false;
                            native.mediaVibrate(Core.ScanCode.ok, "");
                        });
                    }
                }, function (message) {
                    block = false;
                    native.mediaVibrate(Core.ScanCode.error, "");
                    native.showToast(message);
                });
            }

        },
        countFee: function () {
            if ($vue.scanList.length > 0) {
                var cod = 0;
                var pickTotalFee = 0;
                $.each($vue.scanList, function (i, v) {
                    cod += v['cod'] * 1;
                    pickTotalFee += v['pickTotalFee'] * 1;
                });
                $vue.cod = cod;
                $vue.pickTotalFee = pickTotalFee;
            }
        }
    };
    Core.init(App);
    window.addScanFromNative = App.addScanFromNative;
    window.refresh = App.initScanList;
    module.exports = App;
});