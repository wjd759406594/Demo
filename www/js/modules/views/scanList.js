/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var $dbInnerManager = require('js/modules/manager/dbInnerManager');
    var scanDetail;
    var sheetPre = Core.Cache.get('sheetPre');
    var $vue;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    showUpload: false,
                    batchNo: "",
                    shopName: "",
                    isConsignNo: 0,
                    scanSheetNo: "",
                    goodAmount: 1,
                    chooseDay: Core.Cache.get('lastScanChooseDay') || 7,
                    loadShift: {},
                    shopId: Core.Cache.get('lastScanShopId') || 0,
                    shifts: [],
                    scanList: [],
                    loadIndex: 0
                },
                methods: {
                    scan:function () {
                      native.scanQr();
                    },
                    sendScan: function () {
                        var that = this;
                        if (that.scanList.length == 0) {
                            native.showToast('没有任何扫码');
                            return false;
                        }
                        Core.App.confirm("是否确认上传？",function () {
                            var tmp = [];
                            $.each(that.scanList, function (i, v) {
                                var obj = {
                                    s: v['s'],
                                    i: v['i'],
                                    l: v['l']
                                };
                                tmp.push(obj);
                            });
                            native.dataCompress(tmp, function (text) {
                                Core.Service.post('api/auth/v1/ltl/sheetScanRecord/collect', {
                                    batchNo: $vue.batchNo,
                                    loadShiftId: "",
                                    shopId: "",
                                    text: text
                                }, function () {
                                    native.showToast("扫码上传成功");
                                    $dbInnerManager.clearScanList(Core.ScanType.lh, function () {
                                        that.$data.scanList = [];
                                        $vue.$data.batchNo = Core.Utils.getBatchNo(App.getBatchKey(), true);
                                    });
                                });
                            });
                        });
                    },
                    removeScan: function (scan) {
                        var that = this;
                        Core.App.confirm("确定删除这条运单记录", '温馨提示', function () {
                            var id = scan['id'];
                            that.scanList.$remove(scan);
                            $dbInnerManager.delScan(id, function () {
                                that.scanList.$remove(scan);
                            });
                        });
                    },
                    removeScanDetail: function (scanLabel, flag) {
                        var that = this;
                        var loadScan = that.scanList[that.loadIndex];
                        Core.App.confirm("确定删除这条扫码记录", '温馨提示', function () {
                            if (flag) {
                                loadScan['i'].$remove(scanLabel);
                            } else {
                                loadScan['l'].$remove(scanLabel);
                            }
                            $dbInnerManager.updateScan(loadScan['id'], loadScan, function () {
                                console.log('成功');
                                that.$data.scanList[that.loadIndex] = App.buildShift(loadScan);
                            });
                        });
                    },
                    addScan: function () {
                        var that = this;
                        if (that.goodAmount < 1) {
                            native.showToast('运单件数要大于0');
                            return false;
                        }
                        var time = (new Date()).getTime();
                        var params = {
                            batchNo: $vue.batchNo,
                            type: Core.ScanType.lh,
                            createTime: time,
                            sheetNo: that.scanSheetNo,
                            sheetLabelNo:"",
                            goodsInputAmount: that.goodAmount,
                            scanAmount: 0,
                            scanType: 1,
                            shopId: 0,
                            refId: 0,
                            isConsignNo: $vue.isConsignNo
                        };
                        App.renderScanList(params);
                    },
                    showScan: function (index) {
                        $vue.loadIndex = index;
                        Core.Page.changePage({pageName: 'scanDetail'});
                    }
                }
            });
            window.vv = $vue;
            this.initEvent();
            this.initScanList();
            document.addEventListener('getScan', App.addScanFromNative, false);
            document.addEventListener('getQR', App.getQR, false);
        },
        getQR: function (e) {
            var sheetNo = Core.Utils.getSheetNoFromScan(e.detail['code']);
            if (sheetNo == "") {
                return false;
            }
            var time = (new Date()).getTime();
            sheetNo = sheetNo.startsWith(sheetPre) ? Core.Utils.getSheetNo(sheetNo) : sheetNo;
            var params = {
                batchNo: $vue.batchNo,
                type: Core.ScanType.lh,
                createTime: time,
                sheetNo: sheetNo,
                sheetLabelNo: sheetNo,
                goodsInputAmount: 1,
                scanAmount: 0,
                scanType: 2,
                shopId: "",
                refId: "",
                isConsignNo: sheetNo.startsWith(sheetPre)
            };
            App.renderScanList(params);
        },
        initPageEvent: function () {
            /* $$(document).on('pageInit', '.page[data-page="scanDetail"]', function (e) {
             //document.removeEventListener('getScan', App.addScanFromNative, false);
             });*/
        },
        initScanList: function () {
            $vue.$data.batchNo = Core.Utils.getBatchNo(App.getBatchKey());
            //获取揽活列表
            $dbInnerManager.getScanList(Core.ScanType.lh, function (result) {
                $vue.$data.scanList = result;
            });
        },
        initEvent: function () {
            $("body").on('click', '.showScan', function () {
                scanDetail = $(this).data('val');
                Core.Page.changePage('scanDetail.html');
            });
        },
        getBatchKey: function () {
            return Core.ScanType.lh;
        },
        /**
         * 客户的扫码事件
         * @param e
         * @returns {boolean}
         */
        addScanFromNative: function (e) {
            if (Core.App.mainView.activePage.name !== "scanList") {
                return false;
            }
            var sheetLabelNo = Core.Utils.getSheetNoFromScan(e.detail['sheetLabelNo']);
            if (sheetLabelNo == "") {
                return false;
            }
            var time = (new Date()).getTime();
            var sheetNo = sheetLabelNo.startsWith(sheetPre) ? Core.Utils.getSheetNo(sheetLabelNo) : sheetLabelNo;
            var params = {
                batchNo: $vue.batchNo,
                type: Core.ScanType.lh,
                createTime: time,
                sheetNo: sheetNo,
                sheetLabelNo: sheetLabelNo,
                goodsInputAmount: 1,
                scanAmount: 0,
                scanType: 2,
                shopId: "",
                refId: "",
                isConsignNo: sheetLabelNo.startsWith(sheetPre) ? 0 : 1
            };
            App.renderScanList(params);
        },
        /**
         * 选择本地扫码列表
         * @param params
         */
        renderScanList: function (params) {
            $dbInnerManager.addScan(params, function (scan) {
                native.mediaVibrate(Core.ScanCode.ok, "");
                if ($vue.scanList.length > 0) {
                    $.each($vue.scanList, function (i, v) {
                        if (v.id == scan.id) {
                            $vue.scanList.$remove(v);
                            return false;
                        }
                    });
                }
                $vue.scanList.unshift(scan);
            });
        }
    };
    Core.init(App);
    window.addScanFromNative = App.addScanFromNative;
    module.exports = App;
});