/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var $dbInnerManager = require('js/modules/manager/dbInnerManager');
    var $vue;
    var scanDetail;
    var shifts = [];
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    title: "",
                    type: "",
                    batchNo: "",
                    scanSheetNo: "",
                    nextShopName: "",
                    nextShopId: 0,
                    backIndex: "",
                    backCount: "",
                    loadShift: {},
                    scanList: [],
                    ruleType: 0,
                    sheetRule: {},
                    lastScanInfo: "",
                    loadIndex: 0
                },
                watch: {
                    "type": function (val) {
                        if (val) {
                            switch (val) {
                                case Core.ScanType.hdqs:
                                    this.title = "签收";
                                    break;
                                case Core.ScanType.hdsh:
                                    this.title = "收回";
                                    break;
                                case Core.ScanType.hdjkh:
                                    this.title = "交客户";
                                    break;
                            }
                        }
                    }
                },
                methods: {
                    sendScan: function () {
                        var that = this;
                        if (that.scanList.length == 0) {
                             native.showToast('没有任何扫码');
                            return false;
                        }
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
                            Core.Service.post('api/auth/v1/ltl/backSheetManage/send', {
                                batchNo: that.batchNo,
                                scanType: $vue.type,
                                text: text
                            }, function (result) {
                                $vue.$data.batchNo = Core.Utils.getBatchNo(App.getBatchKey(), true);
                                $dbInnerManager.clearScanList($vue.type, function () {
                                    that.$data.scanList = [];
                                });
                                native.showToast(result['message']);
                            });
                        });
                    },
                    showScan: function (sc, index) {
                        scanDetail = sc;
                        $vue.loadIndex = index;
                        Core.Page.changePage({pageName: 'scanDetail'});
                    },
                    removeScan: function (scan) {
                        var that = this;
                        Core.App.confirm("确定删除这条回单记录", '温馨提示', function () {
                            var id = scan['id'];
                            that.scanList.$remove(scan);
                            $dbInnerManager.delScan(id, function () {
                                that.scanList.$remove(scan);
                            });
                        });
                    },
                    addScan: function () {
                        var that = this;
                        if (that.scanSheetNo.length != sheetLength) {
                             native.showToast('请输入12位的运单号');
                            return false;
                        }
                        if (that.backCount < 1 || that.backCount > 99) {
                             native.showToast('请输入1~99的回单总数');
                            return false;
                        }
                        var time = (new Date()).getTime();
                        var params = {
                            batchNo: $vue.batchNo,
                            type: $vue.type,
                            createTime: time,
                            sheetNo: that.scanSheetNo,
                            sheetLabelNo: "",
                            goodsInputAmount: 1,
                            goodsAmount: that.backCount,
                            storeAmount: that.backCount,
                            scanType: 1,
                            sheetNoConsign: "",
                            shopId: "",
                            refId: ""
                        };
                        App.renderScanList(params);
                    }
                }
            });
            this.initInfo();
            this.initEvent();
            document.addEventListener('getScan', App.addScanFromNative, false);
        },
        /**
         * 客户的扫码事件
         * @param e
         * @returns {boolean}
         */
        addScanFromNative: function (e) {
            var sheetLabelNo = Core.Utils.getSheetNoFromScan(e.detail['sheetLabelNo']);
            if (sheetLabelNo == "") {
                return false;
            }
            var time = (new Date()).getTime();

            if (Core.App.mainView.activePage.name == "scanAdd") {
                var short;
                if (Core.Utils.isMySheet(sheetLabelNo)) {
                    short = Core.Utils.getShortSheetNo(sheetLabelNo);
                } else {
                    short = sheetLabelNo;
                }
                $vue.scanSheetNo = short;
                return false;
            }

            if (!Core.Utils.isMySheet(sheetLabelNo)) {
                 native.showToast("不识别该单号", "注意啦!");
                native.mediaVibrate(Core.ScanCode.error, "注意啦");
                return false;
            }
            var backSheetObj = Core.Utils.getBackShiftShortSheetNo(sheetLabelNo);
            var params = {
                batchNo: $vue.batchNo,
                type: $vue.type,
                createTime: time,
                sheetNo: backSheetObj['no'],
                sheetLabelNo: backSheetObj['label'],
                goodsInputAmount: 0,
                goodsAmount: backSheetObj['count'] * 1,
                storeAmount: backSheetObj['count'] * 1,
                goodsName: "",
                fromShopName: "",
                toShopName: "",
                scanType: 2,
                sheetNoConsign: "",
                shopId: "",
                refId: ""
            };
            App.renderScanList(params);
        },
        /**
         * 格式化运单数据
         * @param scan
         * @returns {*}
         */
        buildShift: function (scan) {
            scan['state'] = '';
            var amount = scan['inputCount'] * 1 + scan['labelCount'] * 1;
            if (amount == scan['goodsAmount']) {
                scan['state'] = 'success';
            }
            if (amount > scan['goodsAmount'] || amount > scan['storeAmount']) {
                scan['state'] = 'lg';
            }
            return scan;
        },
        initEvent: function () {
            $$(document).on('pageAfterAnimation', '.page[data-page="scanDetail"]', function (e) {
                Core.App.showPreloader();
                console.log(scanDetail);
                if (scanDetail["l"] && scanDetail["l"].length > 0) {
                    scanDetail["l"].sort(function (a, b) {
                        var i = a.l.substr(a.l.length - 8, a.l.length);
                        var j = b.l.substr(b.l.length - 8, b.l.length);
                        var count = i - j;
                        if (count < 0) {
                            return -1;
                        }
                        if (count > 0) {
                            return 1;
                        }
                        return 0;
                    });
                }
                var html = Core.Template.render('scanDetailTmpl', scanDetail);
                $('#scanDetailContent').html(html);
                Core.App.hidePreloader();
            }).on('pageAfterBack', '.page[data-page="scanDetail"]', function (e) {
                $('#scanDetailContent').empty();
            }).on('click', '.removeScanDetail', function () {
                var index = $(this).data('val');
                var type = $(this).data('type');
                Core.App.confirm("确定删除这条回单记录", '温馨提示', function () {
                    App.removeScanDetail(index, type);
                });
            });
        },
        /**
         * 加载运单的本地扫码列表
         */
        initScanList: function () {
            $dbInnerManager.findScanListByType($vue.type, function (result) {
                if (result) {
                    var scanList = [];
                    $.each(result, function (i, v) {
                        scanList.push(App.buildShift(v));
                    });
                    $vue.$data.scanList = scanList;
                }
            });
        },
        removeScanDetail: function (index, type) {
            if (type == 1) {
                scanDetail['i'].remove(index);
            } else {
                scanDetail['l'].remove(index);
            }
            $dbInnerManager.updateScan(scanDetail['id'], scanDetail, function () {
                $("#scanDetail_" + type + "_" + index).remove();
                App.buildShift(scanDetail);
            });
        },
        /**
         * 添加扫码
         * @param params
         */
        renderScanList: function (params) {
            //TODO 更新本地库存列表
            $dbInnerManager.addHdScan(params, function (scan) {
                var hadAdd = false;
                var showScan = App.buildShift(scan);
                if ($vue.scanList.length > 0) {
                    $.each($vue.scanList, function (i, v) {
                        if (v.id == scan.id) {
                            hadAdd = true;
                            $.each(v, function (i1) {
                                v[i1] = showScan[i1];
                            });
                            return false;
                        }
                    });
                }
                if (scan['st'] == 1) {
                    $vue.backCount = "";
                    $vue.scanSheetNo = "";
                    native.showToast("手工单添加成功");
                    Core.Page.back();
                }
                if (!hadAdd) {
                    $vue.scanList.unshift(showScan);
                }
               //$vue.$data.lastScanInfo = showScan;
            });
        },
        /**
         * 初始化数据
         */
        initInfo: function () {
            console.log('aaa');
            $vue.type = Core.Cache.get("backShiftType");
            $vue.$data.batchNo = Core.Utils.getBatchNo(App.getBatchKey());
            App.initScanList();
        },
        getBatchKey: function () {
            return "BackShift_" + $vue.type;
        },
        /**
         * 渲染库存列表
         * @param result
         */
        renderShift: function (result) {
            shifts = result['rows'];
            App.initScanList();
        },
        /**
         * 页面重新载入 刷新数据
         */
        refresh: function () {
            App.initInfo();
        }
    };
    window.refresh = App.refresh;
    window.addScanFromNative = App.addScanFromNative;
    Core.init(App);
    module.exports = App;
});