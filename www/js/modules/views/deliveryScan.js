define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var beginTime = (new Date()).GetDay(15, "");
    var endTime = (new Date()).Format("yyyy-MM-dd") + " 23:59:59";
    var $dbInnerManager = require('js/modules/manager/dbInnerManager');
    var scanDetail;
    var type = Core.ScanType.shzc;
    var $vue;
    var deliveryTask;
    var shifts = [];
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    batchNo: "",
                    scanSheetNo: "",
                    goodAmount: "",
                    goodsDq: false,
                    deliveryTask: {},
                    scanList: [],
                    lastScanInfo: "",
                    loadIndex: 0,
                    force: 0,
                    total: 0,
                    totalGoodsAmount: 0,
                    totalStoreAmount: 0
                },
                computed: {
                    totalCounts: function () {
                        var labelCount = 0;
                        var inputCount = 0;
                        if (this.scanList.length > 0) {
                            $.each(this.scanList, function (i, v) {
                                labelCount += v['labelCount'] * 1;
                                inputCount += v['inputCount'] * 1;
                            });
                        }
                        return {
                            labelCount: labelCount,
                            inputCount: inputCount,
                            total: labelCount + inputCount
                        };
                    }
                },
                watch: {
                    "force": function (val) {
                        if (val) {
                            Core.App.confirm("是否开启强制装车", function () {
                            }, function () {
                                $vue.force = false;
                            })
                        }
                    }
                },
                methods: {
                    /**
                     * 删除运单
                     * @param scan
                     */
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
                    /**
                     * 添加运单
                     * @returns {boolean}
                     */
                    addScan: function () {
                        var that = this;
                        if (that.scanSheetNo.length < 6) {
                            native.showToast('请输入最少6位的运单号');
                            return false;
                        }
                        if (!that.goodsDq && that.goodAmount < 1) {
                            native.showToast('运单件数要大于0');
                            return false;
                        }
                        var time = (new Date()).getTime();
                        var params = {
                            batchNo: $vue.batchNo,
                            type: type,
                            createTime: time,
                            sheetNo: that.scanSheetNo,
                            goodsInputAmount: that.goodAmount,
                            scanAmount: 0,
                            scanType: 1,
                            shopId: that.deliveryTask['deliveryShopId'],
                            goodsCount: "",
                            refId: that.deliveryTask.id,
                            scanDetail: {}
                        };
                        var stock = Core.Utils.hadInStock(that.scanSheetNo, shifts);
                        if (stock['flag'] == true) {
                            //在库存中
                            params.sheetNo = stock['sheetNo'];
                            // params.goodsInputAmount = 1;
                            params.dq = that.goodsDq;
                            params.goodsAmount = stock['goodsAmount'];
                            params.storeAmount = stock['storeAmount'];
                            params.goodsName = stock['goodsName'];
                            params.fromShopName = stock['fromShopName'];
                            params.toShopName = stock['toShopName'];
                            params.sheetNoConsign = stock['sheetNoConsign'];
                            App.renderScanList(params);
                        } else {
                            native.mediaVibrate(Core.ScanCode.error, "串货了");
                        }
                    },
                    /**
                     * 显示运单扫码详情
                     * @param sc
                     * @param index
                     */
                    showScan: function (sc, index) {
                        Core.App.showPreloader();
                        scanDetail = sc;
                        $vue.loadIndex = index;
                        Core.Page.changePage({pageName: 'scanDetail'});
                    },
                    /**
                     * 上传并上传扫码
                     * @returns {boolean}
                     */
                    fc: function () {
                        Core.App.confirm("上传成功后会清空扫码!", "确认上传?", function () {
                            $dbInnerManager.findScanListByTRW(type, $vue.deliveryTask['id'], $vue.deliveryTask['deliveryShopId'], function (scanList) {
                                var tmp = [];
                                if (scanList) {
                                    /* native.showToast("该班次没有扫码,不准发空车");
                                     return false;*/
                                    $.each(scanList, function (i, v) {
                                        var obj = {
                                            s: v['s'],
                                            i: v['i'],
                                            l: v['l']
                                        };
                                        tmp.push(obj);
                                    });
                                }
                                native.dataCompress(tmp, function (text) {
                                    $vue.batchNo = Core.Utils.getBatchNo(App.getBatchKey());
                                    Core.Service.post('api/auth/v1/ltl/sheetScanRecord/delivery', {
                                        batchNo: $vue.batchNo,
                                        deliveryTaskId: $vue.deliveryTask['id'],
                                        sendShopId: $vue.deliveryTask['deliveryShopId'],
                                        licensePlate: $vue.deliveryTask.licensePlate,
                                        driverName: $vue.deliveryTask.driverName,
                                        arriveShopId: "",
                                        text: text
                                    }, function () {
                                        $dbInnerManager.clearScanListByTRW(type, $vue.deliveryTask['id'], $vue.deliveryTask['deliveryShopId'], function () {
                                            $vue.batchNo = Core.Utils.removeBatchNo(App.getBatchKey());
                                            Core.App.alert("上传成功", function () {
                                                Core.Page.back();
                                            })
                                        });
                                    });
                                });
                            });
                        });
                    }
                }
            });
            this.initEvent();
            this.initInfo();
            document.addEventListener('getScan', App.addScanFromNative, false);
        },
        /**
         * 删除单条扫码记录
         * @param index
         * @param type
         */
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
         * 客户的扫码事件
         * @param e
         * @returns {boolean}
         */
        addScanFromNative: function (e) {
            var sheetLabelNo = Core.Utils.getSheetNoFromScan(e.detail['sheetLabelNo']);
            if (sheetLabelNo == "") {
                return false;
            }
            var sheetNo = Core.Utils.getSheetNoFromScan(e.detail['sheetLabelNo']);
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

            var params = {
                batchNo: $vue.batchNo,
                type: type,
                createTime: time,
                sheetNo: Core.Utils.isMySheet(sheetLabelNo) ? Core.Utils.getShortSheetNo(sheetLabelNo) : sheetLabelNo,
                sheetLabelNo: sheetLabelNo,
                goodsInputAmount: 1,
                scanAmount: 0,
                scanType: 2,
                shopId: $vue.deliveryTask['deliveryShopId'],
                refId: $vue.deliveryTask['id']
            };

            var deliveryTask = Core.Cache.get('deliveryTask');

            var stock = Core.Utils.hadInStock(params.sheetNo, shifts);
            if (stock['flag'] == true) {
                //在库存中
                params.sheetNo = stock['sheetNo'];
                params.goodsAmount = stock['goodsAmount'];
                params.storeAmount = stock['storeAmount'];
                params.goodsName = stock['goodsName'];
                params.fromShopName = stock['fromShopName'];
                params.toShopName = stock['toShopName'];
                params.sheetNoConsign = stock['sheetNoConsign'];
                App.renderScanList(params);
            } else {
                native.mediaVibrate(Core.ScanCode.error, "串货了");
            }
        },
        initEvent: function () {
            $$(document).on('pageAfterAnimation', '.page[data-page="scanDetail"]', function (e) {
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
            }).on('pageAfterBack', '.page[data-page="scanDetail"]', function () {
                $('#scanDetailContent').empty();
            }).on('click', '.removeScanDetail', function () {
                var index = $(this).data('val');
                var type = $(this).data('type');
                Core.App.confirm("确定删除这条扫码记录", '温馨提示', function () {
                    App.removeScanDetail(index, type);
                });
            });
        },
        /**
         * 加载运单的本地扫码列表
         */
        initScanList: function () {
            //获取揽活列表
            $dbInnerManager.findScanListByTRW(type, $vue.deliveryTask['id'], $vue.deliveryTask['deliveryShopId'], function (result) {
                if (result) {
                    var scanList = [];
                    $.each(result, function (i, v) {
                        scanList.push(App.buildShift(v));
                    });
                    $vue.scanList = scanList;
                }
            });
        },
        /**
         * 添加扫码
         * @param params
         */
        renderScanList: function (params) {
            $dbInnerManager.addZcScan(params, function (scan) {
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
                    native.showToast("手工单添加成功");
                    $vue.goodAmount = "";
                    $vue.goodsDq = false;
                    $vue.scanSheetNo = "";
                    Core.Page.back();
                }
                if (!hadAdd) {
                    $vue.scanList.unshift(showScan);
                }
                $vue.lastScanInfo = showScan;
            });
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
        /**
         * 初始化数据
         */
        initInfo: function () {
            $vue.force = false;
            $vue.deliveryTask = Core.Cache.get('deliveryTask');
            $vue.batchNo = Core.Utils.getBatchNo(App.getBatchKey());
            App.getdeliveryTask();
        },
        getBatchKey: function () {
            return type + "_" + $vue.deliveryTask['deliveryTaskId'] + "_" + $vue.deliveryTask['deliveryShopId'];
        },
        /**
         * 渲染库存列表
         * @param result
         */
        renderShift: function (result) {
            deliveryTask = result;
            shifts = result['rows'];
            $vue.total = result['total'];
            $vue.totalGoodsAmount = result['totalGoodsAmount'];
            $vue.totalStoreAmount = result['totalStoreAmount'];
            App.initScanList();
        },
        /**
         * 加载库存
         */
        getdeliveryTask: function () {
            shifts = [];
            Core.Service.get('api/auth/v1/ltl/deliverySheet/findLoadingSheet', {
                deliveryTaskId: $vue.deliveryTask.id,
                deliveryShopId: $vue.deliveryTask.deliveryShopId,
                beginTime: beginTime,
                endTime: endTime
            }, function (result) {
                if (result['data']['rows'].length == 0) {
                    native.showToast("云端没有库存");
                    App.renderShift(result['data']);
                    return false;
                }
                App.renderShift(result['data']);
            });
        }
    };
    Core.init(App);
    module.exports = App;
});