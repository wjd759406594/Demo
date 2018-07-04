/**
 * Created by denonzhu on 15/12/14.
 */
/**
 * 通过ID去重对象数组 数组子对象要包含id的属性
 * @param array
 * @returns {Array}
 */
function uniqueArrById(array) {
    var r = [];
    for (var i = 0, l = array.length; i < l; i++) {
        for (var j = i + 1; j < l; j++)
            if (array[i]['id'] === array[j]['id']) j = ++i;
        r.push(array[i]);
    }
    return r;
}

/**
 * 合并数组 并重构 显示库存状态
 * @param arr1  库存
 * @param arr2  扫码列表
 * @returns {Array}
 * @constructor
 */
function MergeArray(arr1, arr2) {
    var _arr = [];
    for (var i = 0; i < arr1.length; i++) {
        arr1[i]['state'] = "";
        arr1[i]['labelCount'] = 0;
        arr1[i]['inputCount'] = 0;
        for (var j = 0; j < arr2.length; j++) {
            if (arr1[i]['sheetNo'] === arr2[j]['s']) {
                var amount = arr2[j]['inputCount'] * 1 + arr2[j]['labelCount'] * 1;
                if (amount == arr2[j]['goodsAmount']) {
                    arr1[i]['state'] = 'success';
                }
                if (amount > arr2[j]['goodsAmount'] || amount > arr2[j]['storeAmount']) {
                    arr1[i]['state'] = 'lg';
                }
                arr1[i]['labelCount'] = arr2[j]['labelCount'];
                arr1[i]['inputCount'] = arr2[j]['inputCount'];
                break;
            }
        }
        _arr.push(arr1[i]);
    }
    return _arr;
}

define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var beginTime = (new Date()).GetDay(15, "");
    var endTime = (new Date()).Format("yyyy-MM-dd") + " 23:59:59";
    var $dbInnerManager = require('js/modules/manager/dbInnerManager');
    var analytics = require('js/modules/core/analytics');

    var IDB = $dbInnerManager.getIDB();
    var scanDetail;
    var type;
    var $vue;
    var block = false;
    var loadShift;
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
                    loadShift: {},
                    scanList: [],
                    lastScanInfo: "",
                    loadIndex: 0,
                    force: 0,
                    total: 0,
                    totalGoodsAmount: 0,
                    totalStoreAmount: 0,
                    stores: []
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
                        console.log(val);
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
                     * 同步库存
                     */
                    remoteShift: _.throttle(function () {
                        Core.App.confirm("确认同步库存,会清空本地库存数据,请勿频繁操作", '温馨提示', function () {
                            //清楚本地
                            $dbInnerManager.clearLoadShift($vue.loadShift['id'], $vue.loadShift['shopId'], function () {
                                App.getLoadShift();
                            });
                        });
                    }, 100),
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
                    addScan: _.throttle(function () {
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
                            shopId: that.loadShift.shopId,
                            goodsCount: "",
                            refId: that.loadShift.id,
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
                            App.checkSheetFromRemote(params);
                        }
                    }, 100),
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
                     * 上传扫码
                     */
                    send: function () {
                        analytics.onClickEvent(0x3030008);
                        Core.App.confirm("上传成功后会清空扫码!", "确认上传?", function () {
                            $dbInnerManager.findScanListByTRW(type, $vue.loadShift['id'], $vue.loadShift['shopId'], function (scanList) {
                                debugger;
                                if (scanList.length == 0) {
                                    native.showToast("该班次没有扫码,不能上传");
                                    return false;
                                }
                                var tmp = [];
                                $.each(scanList, function (i, v) {
                                    var obj = {
                                        s: v['s'],
                                        i: v['i'],
                                        l: v['l']
                                    };
                                    tmp.push(obj);
                                });
                                native.dataCompress(tmp, function (text) {
                                    $vue.batchNo = Core.Utils.getBatchNo(App.getBatchKey());
                                    Core.Service.post('api/auth/v1/ltl/sheetScanRecord/send', {
                                        batchNo: $vue.batchNo,
                                        loadShiftId: $vue.loadShift['id'],
                                        sendShopId: $vue.loadShift['shopId'],
                                        arriveShopId: "",
                                        isSend: 0,
                                        text: text
                                    }, function () {
                                        $dbInnerManager.clearScanListByTRW(type, $vue.loadShift['id'], $vue.loadShift.shopId, function () {
                                            $vue.batchNo = Core.Utils.removeBatchNo(App.getBatchKey());
                                            Core.App.alert("上传成功")
                                        });
                                    });
                                });
                            });
                        });
                    },

                    /**
                     * 录入
                     */
                    scanAdd: function () {
                        analytics.onClickEvent(0x303000A);
                    },
                    /**
                     * 录入
                     */
                    sendCar: function () {
                        analytics.onClickEvent(0x3030009);
                    },


                    /**
                     * 发车并上传扫码
                     * @returns {boolean}
                     */
                    fc: function () {
                        analytics.onClickEvent(0x3030009);
                        if ($vue.loadShift.shopId == "") {
                            native.showToast("请选择发货网点");
                            return false;

                        }
                        if (!$vue.loadShift.licensePlate || $vue.loadShift.licensePlate == "") {
                            native.showToast("请选择车牌");
                            return false;

                        }
                        if (!$vue.loadShift.driverName || $vue.loadShift.driverName == "") {
                            native.showToast("请选择司机");
                            return false;

                        }

                        Core.App.confirm("发车后会自动上传本地扫码并清空扫码!", "确认发车?", function () {
                            $dbInnerManager.findScanListByTRW(type, $vue.loadShift['id'], $vue.loadShift['shopId'], function (scanList) {
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
                                    Core.Service.post('api/auth/v1/ltl/sheetScanRecord/send', {
                                        batchNo: $vue.batchNo,
                                        loadShiftId: $vue.loadShift['id'],
                                        sendShopId: $vue.loadShift['shopId'],
                                        licensePlate: $vue.loadShift.licensePlate,
                                        driverName: $vue.loadShift.driverName,
                                        arriveShopId: "",
                                        isSend: 1,
                                        text: text
                                    }, function () {
                                        $dbInnerManager.clearLoadShift($vue.loadShift['id'], $vue.loadShift.shopId, function () {
                                            $dbInnerManager.clearScanListByTRW(type, $vue.loadShift['id'], $vue.loadShift.shopId, function () {
                                                $vue.batchNo = Core.Utils.removeBatchNo(App.getBatchKey());
                                                Core.Page.back();
                                                Core.App.alert("发车成功", function () {
                                                    Core.Page.back();
                                                })
                                            });
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
        addScanFromNative: _.throttle(function (e) {
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
                shopId: $vue.loadShift.shopId,
                refId: $vue.loadShift['id']
            };

            var loadShift = Core.Cache.get('loadShift');

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
                App.checkSheetFromRemote(params);
            }
        }, 100),
        /**
         * 远程查找运单
         */
        checkSheetFromRemote: function (params) {
            if (!Core.isLoading) {
                Core.Service.get('api/auth/v1/ltl/loadShiftSheet/getLoadingSheet', {
                    sheetNoShort: params.sheetNo,
                    loadShiftId: $vue.loadShift.id,
                    loadShopId: $vue.loadShift.shopId,
                    nextShopId: 0,
                    force: $vue.force,
                    beginTime: beginTime,
                    endTime: endTime
                }, function (result) {
                    params.sheetNo = result['data']['sheetNoShort'];
                    params.goodsAmount = result['data']['goodsAmount'];
                    params.goodsName = result['data']['goodsName'];
                    params.goodsAmount = result['data']['goodsAmount'];
                    params.storeAmount = result['data']['storeAmount'];
                    params.goodsName = result['data']['goodsName'];
                    params.fromShopName = result['data']['fromShopName'];
                    params.toShopName = result['data']['toShopName'];
                    params.sheetNoConsign = result['data']['sheetNoConsign'];
                    App.renderScanList(params);
                    App.syncRemoteLoadShift();
                }, function (message) {
                    native.mediaVibrate(Core.ScanCode.error, message);
                });
            }
        },
        initEvent: function () {
            $$(document).on('pageAfterAnimation', '.page[data-page="scanDetail"]', function () {
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
            }).on('pageInit', '.page[data-page="findLineBranch"]', function (e) {
                console.log("findLineBranch");
                App.findLineBranch();
            }).on('pageInit', '.page[data-page="findLicensePlate"]', function (e) {
                console.log("findLicensePlate");
                App.findLicensePlate();
            }).on('pageInit', '.page[data-page="findDriver"]', function (e) {
                console.log("findDriver");
                App.findDriver();
            }).on('pageAfterAnimation', '.page[data-page="showStore"]', function (e) {
                var stores = [];
                if (shifts.length > 0) {
                    stores = uniqueArrById(shifts);
                }
                if ($vue.scanList.length > 0) {
                    stores = MergeArray(stores, $vue.scanList);
                }
                $vue.stores = stores;
            }).on('pageAfterBack', '.page[data-page="showStore"]', function () {
                $vue.stores = [];
            });


            $('body').on('click', '#findLicensePlatePage .item-link', function () {
                var tmp = $(this).data('val');
                if ('id' in $vue.loadShift) {
                    $vue.loadShift.licensePlate = tmp['licensePlate'];
                    $vue.loadShift.truckId = tmp['id'];
                    $vue.loadShift.driverName = tmp['driverName'];
                    $vue.loadShift.driverId = tmp['driverId'];
                }
                Core.App.mainView.back();
            }).on('click', '#findDriverPage .item-link', function () {
                var tmp = $(this).data('val');
                if ('id' in $vue.loadShift) {
                    $vue.loadShift.driverName = tmp['name'];
                    $vue.loadShift.driverId = tmp['id'];
                }
                Core.App.mainView.back();
            }).on('refresh', '#findLicensePlatePage .pull-to-refresh-content', function () {
                App.refreshLicensePlate();
            }).on('refresh', '#findDriverPage .pull-to-refresh-content', function () {
                App.refreshDriver();
            });
        },
        /**
         * 加载运单的本地扫码列表
         */
        initScanList: function () {
            //获取揽活列表
            $dbInnerManager.findScanListByTRW(type, $vue.loadShift['id'], $vue.loadShift.shopId, function (result) {
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
            $vue.loadShift = Core.Cache.get('loadShift');
            type = $vue.loadShift['type'] == "scanAgain" ? Core.ScanType.azc : Core.ScanType.zc;
            $vue.batchNo = Core.Utils.getBatchNo(App.getBatchKey());
            App.getLoadShift();
        },
        getBatchKey: function () {
            return type + "_" + $vue.loadShift['loadShiftId'] + "_" + $vue.loadShift.shopId;
        },
        /**
         * 渲染库存列表
         * @param result
         */
        renderShift: function (result) {
            loadShift = result;
            shifts = result['rows'];
            $vue.total = result['total'];
            $vue.totalGoodsAmount = result['totalGoodsAmount'];
            $vue.totalStoreAmount = result['totalStoreAmount'];
            App.initScanList();
        },
        /**
         * 加载库存
         */
        getLoadShift: function () {
            var insertData = {
                shopId: $vue.loadShift['shopId'] * 1,
                loadShiftId: $vue.loadShift['id'] * 1
            };
            shifts = [];
            IDB.transaction('rw', IDB.scanList, IDB.loadShift, function () {
                $dbInnerManager.findLoadShift($vue.loadShift['id'], $vue.loadShift.shopId, function (result) {
                    if (result) {
                        App.renderShift(result);
                    } else {
                        Core.Service.get('api/auth/v1/ltl/loadShiftSheet/findLoadingSheet', {
                            loadShiftId: $vue.loadShift.id,
                            loadShopId: $vue.loadShift.shopId,
                            nextShopId: 0,
                            beginTime: beginTime,
                            endTime: endTime
                        }, function (result) {
                            if (result['data']['rows'].length == 0) {
                                native.showToast("云端没有库存");
                                App.renderShift(result['data']);
                                return false;
                            }
                            $dbInnerManager.addLoadShift(Object.assign(insertData, result['data']), function (result) {
                                native.showToast("同步库存成功");
                                App.renderShift(result);
                            });
                        });
                    }
                });
            }).catch(function (e) {
                Core.App.alert(JSON.stringify(e), "数据库错误");
            });
        },
        /**
         * 同步库存
         */
        syncRemoteLoadShift: function (showMsg) {
            IDB.transaction('rw', IDB.scanList, IDB.loadShift, function () {
                Core.Service.get('api/auth/v1/ltl/loadShiftSheet/findLoadingSheet', {
                    lastDownloadDate: loadShift['lastDownloadDate'],
                    loadShiftId: $vue.loadShift.id,
                    loadShopId: $vue.loadShift.shopId,
                    nextShopId: 0,
                    beginTime: beginTime,
                    endTime: endTime
                }, function (result) {
                    if (result['data']['rows'].length == 0) {
                        if (showMsg) {
                            native.showToast("库存已经最新");
                        }
                        return false;
                    }
                    var newData = result['data'];
                    $.each(newData['rows'], function (k, v) {
                        loadShift['rows'].push(v)
                    });
                    loadShift['rows'] = uniqueArrById(loadShift['rows']);
                    loadShift['lastDownloadDate'] = newData['lastDownloadDate'];
                    loadShift['total'] = loadShift['total'] + newData['total'];
                    loadShift['totalGoodsAmount'] = loadShift['totalGoodsAmount'] + newData['totalGoodsAmount'];
                    loadShift['totalSheetAmount'] = loadShift['totalSheetAmount'] + newData['totalSheetAmount'];
                    loadShift['totalStoreAmount'] = loadShift['totalStoreAmount'] + newData['totalStoreAmount'];
                    $dbInnerManager.updateLoadShift(loadShift['id'], loadShift, function () {
                        //$("#kcDetail").html("库存运单/件数:" + loadShift['total'] + "/" + loadShift['totalGoodsAmount']);
                        if (showMsg) {
                            native.showToast("库存同步成功");
                        }
                    });
                });
            }).catch(function (e) {
                Core.App.alert(JSON.stringify(e), "数据库错误");
            });
        },
        /**
         * 查找车辆
         */
        findLicensePlate: function () {
            $dbInnerManager.findTruck(function (data) {
                if (data.length == 0) {
                    App.refreshLicensePlate();
                } else {
                    App.renderLicensePlate(data);
                }
            });
        },
        /**
         * 刷新车辆信息
         */
        refreshLicensePlate: function () {
            Core.Service.get('api/auth/v1/ltl/truck/find', {}, function (result) {
                if (result['data'].length > 0) {
                    $dbInnerManager.addTruck(result['data'], function (data) {
                            App.renderLicensePlate(data);
                        }
                    );
                } else {
                    native.showToast("云端没有找到任何司机");
                }
            });
        },
        /**
         * 渲染车辆
         * @param data
         */
        renderLicensePlate: function (data) {
            var tmp = {
                content: data
            };
            console.log(tmp);
            var html = Core.Template.render('licensePlateTmpl', tmp);
            $('.list-block-search').removeClass('hide');
            $("#findLicensePlateContent").html(html);
        },
        /**
         * 查找司机列表
         */
        findDriver: function () {
            $dbInnerManager.findDriver(function (data) {
                if (data.length == 0) {
                    App.refreshDriver();
                } else {
                    App.renderDriver(data);
                }
            });
        },
        /**
         * 刷新司机
         */
        refreshDriver: function () {
            Core.Service.get('api/auth/v1/sys/user/findAllByKeyword', {
                userType: '司机'
            }, function (result) {
                if (result['data'].length > 0) {
                    $dbInnerManager.addDriver(result['data'], function (data) {
                            App.renderDriver(data);
                        }
                    );
                } else {
                    native.showToast("云端没有找到任何司机");
                }
            });
        },
        /**
         * 渲染司机
         * @param data
         */
        renderDriver: function (data) {
            var tmp = {
                content: data
            };
            var html = Core.Template.render('driverTmpl', tmp);
            $('.list-block-search').removeClass('hide');
            $("#findDriverContent").html(html);
        }
    };
    Core.init(App);
    module.exports = App;
});