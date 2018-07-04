/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var $dbInnerManager = require('js/modules/manager/dbInnerManager');
    var scanDetail;
    var $vue;
    var block = false;
    var shifts = [];
    var App = {
        init: function () {
            console.log("页面js初始化成功");

            $vue = new Vue({
                el: '#vueBound',
                data: {
                    batchNo: "",
                    scanSheetNo: "",
                    scanSheetNoConsign: "",
                    nextShopName: "",
                    nextShopId: 0,
                    goodAmount: "",
                    goodsDq: false,
                    loadShift: {},
                    scanList: [],
                    ruleType: 0,
                    lastScanInfo: "",
                    loadIndex: 0,
                    stockList: [],
                    totalSheetAmount: 0,
                    totalSendAmount: 0,
                    totalGoodsAmount: 0
                },
                computed:{
                  totalCounts:function () {
                      var labelCount = 0;
                      var inputCount = 0;
                      if (this.scanList.length > 0) {
                          $.each(this.scanList, function (i, v) {
                              labelCount +=  v['labelCount'] * 1;
                              inputCount += v['inputCount']*1;
                          });
                      }
                      return {
                          labelCount:labelCount,
                          inputCount:inputCount,
                          total:labelCount+inputCount
                      };
                  }
                },
                watch: {},
                methods: {
                    sendScan: function () {
                        var that = this;
                        if (that.scanList.length == 0) {
                            native.showToast('没有任何扫码');
                            return false;
                        }
                        Core.App.confirm("确认上传扫码?", function () {
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
                                Core.Service.post('api/auth/v1/ltl/sheetScanRecord/unload', {
                                    batchNo: that.batchNo,
                                    loadShiftId: that.loadShift['loadShiftId'],
                                    arriveShopId: $vue.loadShift['shopId'],
                                    text: text
                                }, function (data) {
                                    $dbInnerManager.clearScanListByTRW(Core.ScanType.dh, $vue.loadShift['loadShiftId'], $vue.loadShift.shopId, function () {
                                        $vue.$data.batchNo = Core.Utils.getBatchNo(App.getBatchKey(), true);
                                        that.$data.scanList = [];
                                    });
                                    native.showToast("扫码上传成功", function () {
                                    });

                                    if (data && data.length > 0) {
                                        var message = "";
                                        $.each(data, function (i, v) {
                                            message += v['message'] + "<br/>";
                                        });
                                        Core.App.alert(message);
                                    }
                                });
                            });
                        });

                    },
                    remoteShift: function () {
                        if ($vue.loadShift.isArrive == 1) {
                            App.getLoadShift();
                        } else {
                            Core.App.confirm("是否确认到达", function () {
                                App.getLoadShift();
                            });
                        }
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
                    chooseSheet: function (item) {
                        var that = this;
                        var stock = JSON.parse(JSON.stringify(item));
                        var time = (new Date()).getTime();
                        var params = {
                            batchNo: $vue.batchNo,
                            type: Core.ScanType.dh,
                            createTime: time,
                            sheetNo: "",
                            goodsInputAmount: that.goodAmount,
                            scanAmount: 0,
                            scanType: 1,
                            shopId: that.loadShift.shopId,
                            goodsCount: "",
                            dq: that.goodsDq,
                            refId: that.loadShift['loadShiftId'],
                            scanDetail: {}
                        };
                        params.sheetNo = stock['sheetNo'];
                        params.goodsAmount = stock['goodsAmount'];
                        params.storeAmount = stock['storeAmount'];
                        params.goodsName = stock['goodsName'];
                        params.fromShopName = stock['fromShopName'];
                        params.toShopName = stock['toShopName'];
                        params.sheetNoConsign = stock['sheetNoConsign'];
                        params.requirement = stock['requirement'];
                        params.isFlee = stock['isFlee'];
                        params.sendAmount = stock['sendAmount'];
                        App.renderScanList(params);
                        setTimeout(function () {
                            Core.Page.back();
                        }, 400);
                    },
                    addScan: function () {
                        var that = this;
                        if (that.scanSheetNo.length < 6 && that.scanSheetNoConsign.length < 6) {
                            native.showToast('请输入最少6位的运单号/三方单号');
                            return false;
                        }
                        if (!that.goodsDq && that.goodAmount < 1) {
                            native.showToast('运单件数要大于0');
                            return false;
                        }

                        var sheetNo = that.scanSheetNo ? that.scanSheetNo : that.scanSheetNoConsign;

                        var time = (new Date()).getTime();
                        var params = {
                            batchNo: $vue.batchNo,
                            type: Core.ScanType.dh,
                            createTime: time,
                            sheetNo: sheetNo,
                            goodsInputAmount: that.goodAmount,
                            scanAmount: 0,
                            scanType: 1,
                            shopId: that.loadShift.shopId,
                            goodsCount: "",
                            dq: that.goodsDq,
                            refId: that.loadShift['loadShiftId'],
                            scanDetail: {}
                        };
                        var stock;
                        var stockList = Core.Utils.getListInStock(sheetNo, shifts);
                        if (stockList.length > 0) {
                            if (stockList.length == 1) {
                                stock = stockList[0];
                            } else {
                                $vue.stockList = stockList;
                                Core.Page.changePageName('sheetList');
                                return false;
                            }
                            params.sheetNo = stock['sheetNo'];
                            // params.goodsInputAmount = 1;
                            params.goodsAmount = stock['goodsAmount'];
                            params.storeAmount = stock['storeAmount'];
                            params.goodsName = stock['goodsName'];
                            params.fromShopName = stock['fromShopName'];
                            params.toShopName = stock['toShopName'];
                            params.sheetNoConsign = stock['sheetNoConsign'];
                            params.isFlee = stock['isFlee'];
                            params.sendAmount = stock['sendAmount'];
                            App.renderScanList(params);
                        } else {
                            App.checkSheetFromRemote(params);
                        }
                    },
                    showScan: function (sc, index) {
                        scanDetail = sc;
                        $vue.loadIndex = index;
                        Core.Page.changePage({pageName: 'scanDetail'});
                    }
                }
            });
            window.vv = $vue;
            this.initEvent();
            this.initInfo();
            document.addEventListener('getScan', App.addScanFromNative, false);
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
                type: Core.ScanType.dh,
                createTime: time,
                sheetNo: Core.Utils.isMySheet(sheetLabelNo) ? Core.Utils.getShortSheetNo(sheetLabelNo) : sheetLabelNo,
                sheetLabelNo: sheetLabelNo,
                goodsInputAmount: 1,
                scanAmount: 0,
                scanType: 2,
                shopId: $vue.loadShift.shopId,
                refId: $vue.loadShift['loadShiftId']
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
                params.isFlee = stock['isFlee'] ? stock['isFlee'] : 0;
                params.sendAmount = stock['sendAmount'];
                App.renderScanList(params);
            } else {
                App.checkSheetFromRemote(params);
            }
        },
        /**
         * 远程查找运单
         */
        checkSheetFromRemote: function (params) {
            Core.App.closeModal();
            var sheetNo = "";
            var sheetNoShort = "";
            var sheetNoConsign = "";
            if (Core.Utils.isMySheet(params.sheetNo)) {
                sheetNo = params.sheetNo;
            } else {
                sheetNoShort = params.sheetNo;
                sheetNoConsign = $vue.scanSheetNoConsign;
            }

            Core.Service.get('api/auth/v1/ltl/loadShiftSheet/queryArriveSheet', {
                sheetNo: sheetNo,
                sheetNoShort: sheetNoShort,
                sheetNoConsign: sheetNoConsign,
                loadShiftId: $vue.loadShift['loadShiftId']
            }, function (result) {
                if (result['data'].length > 0) {
                    if (result['data'].length == 1) {
                        var data = result['data'][0];
                        params.sheetNo = data['sheetNoShort'];
                        params.goodsAmount = data['goodsAmount'];
                        params.goodsName = data['goodsName'];
                        params.goodsAmount = data['goodsAmount'];
                        params.storeAmount = data['storeAmount'] || data['goodsAmount'];
                        params.goodsName = data['goodsName'];
                        params.fromShopName = data['fromShopName'];
                        params.toShopName = data['toShopName'];
                        params.sheetNoConsign = data['sheetNoConsign'];
                        params.isFlee = data['isFlee'];
                        params.sendAmount = data['sendAmount'];
                        shifts.push(data);
                        App.renderScanList(params);
                    } else {
                        $vue.stockList = result['data'];
                        Core.Page.changePageName('sheetList');
                        return false;
                    }
                } else {
                    native.showToast("无此运单");
                }
            }, function (message) {
                native.showToast(message);
            });
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
            $dbInnerManager.findScanListByTRW(Core.ScanType.dh, $vue.loadShift['loadShiftId'], $vue.loadShift.shopId, function (result) {
                if (result) {
                    var scanList = [];
                    $.each(result, function (i, v) {
                        scanList.push(App.buildShift(v));
                    });
                    $vue.$data.scanList = scanList;
                }
            });
        },
        /**
         * 添加扫码
         * @param params
         */
        renderScanList: function (params) {
            $dbInnerManager.addZcScan(params, function (scan) {
                var showScan = App.buildShift(scan);
                var hadAdd = false;
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
                $vue.$data.lastScanInfo = showScan;
            });
        },
        preAddScan: function (params) {
            $dbInnerManager.preAddScan(params, function (scan) {
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
                if (!hadAdd) {
                    $vue.scanList.unshift(showScan);
                }
                $vue.$data.lastScanInfo = showScan;
            });
        },
        /**
         * 格式化运单数据
         * @param scan
         * @returns {*}
         */
        buildShift: function (scan) {
            var amount = scan['inputCount'] * 1 + scan['labelCount'] * 1;
            scan['state'] = "";
            if (amount == scan['goodsAmount']) {
                scan['state'] = 'success';
            }
            if (amount > scan['goodsAmount'] || amount > scan['storeAmount'] || scan['isFlee'] == 1) {
                scan['state'] = 'lg';
            }
            if (amount == 0) {
                scan['state'] = 'none';
            }
            return scan;
        },
        /**
         * 初始化数据
         */
        initInfo: function () {
            $vue.$data.loadShift = Core.Cache.get('loadShift');
            if ($vue.loadShift.loadShiftOrgShops && $vue.loadShift.loadShiftOrgShops.length > 0) {
                $vue.$data.nextShopId = $vue.loadShift.loadShiftOrgShops[0].id;
            }
            $vue.$data.batchNo = Core.Utils.getBatchNo(App.getBatchKey());
            if ($vue.loadShift.isArrive == 1) {
                App.getLoadShift();
            }
        },
        getBatchKey: function () {
            return Core.ScanType.dh + "_" + $vue.loadShift['loadShiftId'] + "_" + $vue.loadShift.shopId;
        },
        /**
         * 渲染库存列表
         * @param result
         */
        renderShift: function (result) {
            shifts = result['rows'];
            if (shifts.length > 0) {
                var time = (new Date()).getTime();
                $.each(shifts, function (i, v) {
                    $dbInnerManager.findScan(v['sheetNo'], Core.ScanType.dh, function (scan) {
                        if (!scan) {
                            var params = {
                                batchNo: $vue.batchNo,
                                type: Core.ScanType.dh,
                                createTime: time,
                                sheetLabelNo: '',
                                goodsInputAmount: 0,
                                scanAmount: 0,
                                scanType: 2,
                                shopId: $vue.loadShift.shopId,
                                refId: $vue.loadShift['loadShiftId']
                            };
                            params.sheetNo = v['sheetNo'];
                            params.goodsAmount = v['goodsAmount'];
                            params.storeAmount = v['storeAmount'];
                            params.goodsName = v['goodsName'];
                            params.fromShopName = v['fromShopName'];
                            params.toShopName = v['toShopName'];
                            params.sheetNoConsign = v['sheetNoConsign'];
                            params.requirement = v['requirement'];
                            params.sheetNoShort = v['sheetNoShort'];
                            params.sendAmount = v['sendAmount'];
                            App.preAddScan(params);
                        }
                    })
                });
            }
            $vue.totalSheetAmount = result['totalSheetAmount'];
            $vue.totalSendAmount = result['totalSendAmount'];
            $vue.totalGoodsAmount = result['totalGoodsAmount'];
            //$("#kcDetail").html("发货运单/件数/总件数:" + result['totalSheetAmount'] + "/" + result['totalSendAmount'] + "/" + result['totalGoodsAmount']).show();
            App.initScanList();
        },
        /**
         * 远程加载库存
         */
        getLoadShift: function () {
            if ($vue.nextShopId == 0) {
                native.showToast("请选择下一站网点");
                return false;
            }
            shifts = [];
            Core.Service.get('api/auth/v1/ltl/loadShiftOrg/arriveAndFindArriveSheetList', {
                loadShiftId: $vue.loadShift['loadShiftId'],
                arriveShopId: $vue.loadShift['shopId']
            }, function (result) {
                if ($vue.loadShift.isArrive == 0) {
                    $vue.loadShift.isArrive = 1;
                    Core.Cache.set('loadShift', $vue.loadShift);
                }
                var insertData = result['data'];
                if (insertData['rows'].length == 0) {
                    native.showToast("云端没有库存");
                    App.renderShift(insertData);
                    return false;
                }
                insertData['shopId'] = $vue.loadShift.shopId * 1;
                insertData['loadShiftId'] = $vue.loadShift.loadShiftId * 1;
                App.renderShift(insertData);
            });
        },
        /**
         * 页面重新载入 刷新数据
         */
        refresh: function () {
            App.initInfo();
        },
        /**
         * 查找线路
         */
        findLineBranch: function () {
            $dbInnerManager.findLineBranch(function (data) {
                if (data.length == 0) {
                    App.refreshLineBranch();
                } else {
                    App.renderLineBranch(data);
                }
            });
        },
        /**
         * 刷新线路
         */
        refreshLineBranch: function () {
            Core.Service.get('api/auth/v1/ltl/lineBranch/find', {}, function (result) {
                if (result['data'].length > 0) {
                    $dbInnerManager.addLineBranch(result['data'], function (data) {
                            App.renderLineBranch(data);
                        }
                    );
                } else {
                    native.showToast("云端没有找到线路");
                }
            });
        },
        /**
         * 渲染线路
         * @param data
         */
        renderLineBranch: function (data) {
            var tmp = {
                content: data
            };
            var html = Core.Template.render('lineBaranchTmpl', tmp);
            $('.list-block-search').removeClass('hide');
            $("#findLineBranchPageContent").html(html);
        }
    };
    window.refresh = App.refresh;
    window.addScanFromNative = App.addScanFromNative;
    Core.init(App);
    module.exports = App;
});