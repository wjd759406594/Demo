/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var $sheet = require('js/modules/manager/fastSheetConfig');
    var analytics = require('js/modules/core/analytics');

    var attributes = Core.Cache.get('attributes');
    var $dbInnerManager = require('js/modules/manager/dbInnerManager');
    var native = require('js/modules/hybridapi');
    var $vue;
    var today, datePicker;
    var App = {
        init: function () {
            console.log("单车配载初始化成功");
            analytics.onPageEvent(0x2030003);
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    carInfo: {
                        lineBranchId: "",
                        fromShopId: attributes['orgId'],
                        fromShopName: attributes['orgName'],
                        truckId: "",
                        driverId: "",
                        name: "",
                        driverName: "",
                        licensePlate: "",
                        force: 0
                    },
                    privateFlag: 1,
                    loadShift: {},
                    loadIndex: "",
                    shiftLists: [],
                    shift: {},
                    batchNo: ""
                },
                watch: {},
                methods: {
                    /**
                     * 创建班次
                     * @returns {boolean}
                     */
                    createShift: function () {
                        analytics.onClickEvent(0x3030006);
                        if ($vue.carInfo.shopId == "") {
                            native.showToast("请选择发货网点");
                            return false;

                        }
                        if (!$vue.carInfo.licensePlate || $vue.carInfo.licensePlate == "") {
                            native.showToast("请选择车牌");
                            return false;

                        }
                        if (!$vue.carInfo.driverName || $vue.carInfo.driverName == "") {
                            native.showToast("请选择司机");
                            return false;

                        }
                        Core.Service.post('api/auth/v1/ltl/loadShift/create', {
                            lineBranchId: $vue.carInfo.lineBranchId,
                            truckId: $vue.carInfo.truckId,
                            driverId: $vue.carInfo.driverId,
                            shopId: $vue.carInfo.fromShopId,
                            force: $vue.carInfo.force
                        }, function (result) {
                            native.showToast("新建班次成功");
                            $vue.carInfo = {
                                lineBranchId: "",
                                fromShopId: attributes['orgId'],
                                fromShopName: attributes['orgName'],
                                truckId: "",
                                driverId: "",
                                name: "",
                                driverName: "",
                                licensePlate: "",
                                force: 0
                            };
                            $vue.shiftLists.unshift(result['data']);
                            Core.Page.back();
                        });

                    },
                    delCar: function (shift) {
                        // Core.App.confirm("确认删除车次?", function () {
                        //     Core.Service.post('api/auth/v1/ltl/loadShift/delete', {
                        //         loadShiftId: shift.id
                        //     }, function () {
                        //         $vue.shiftLists.$remove(shift);
                        //          native.showToast("删除成功");
                        //     });
                        // });
                    },
                    searchFromShop: function (val) {
                        if (!val) {
                            native.showToast("发货网点最少输入一个字");
                            return false;
                        }
                        Core.Service.get('api/auth/v1/sys/org/findFromShop', {
                            keyword: val
                        }, function (result) {
                            if (result['data'].length > 0) {
                                if (result['data'].length == 1) {
                                    var shop = result['data'][0];
                                    $vue.carInfo.fromShopId = shop['id'];
                                    $vue.carInfo.fromShopName = shop['name'];
                                } else {
                                    var tmp = {
                                        toOrgAreas: result['data']
                                    };
                                    $sheet.lastSearch = tmp;
                                    Core.Page.changePage("findFromShop.html");
                                }
                            } else {
                                native.showToast("云端查不到数据");
                            }
                        });
                    },
                    /**
                     * 设置网点
                     * @param loadShift
                     */
                    sheetOrg: function (loadShift) {
                        $vue.$data.loadShift = loadShift;
                        Core.Page.changePage({pageName: "sheetOrg"});
                    },
                    /**
                     * 添加网点
                     * @returns {boolean}
                     */
                    addSheOrg: function () {
                        var shopId = $("#shopId").val();
                        if (shopId == 0) {
                            native.showToast("请选择到货网点");
                            return false;
                        }
                        var loadShiftId = $vue.loadShift.id;
                        Core.Service.post('api/auth/v1/ltl/loadShiftOrg/create', {
                            shopId: shopId,
                            loadShiftId: loadShiftId,
                            allowRule: "[]",
                            notAllowRule: "[]"
                        }, function (result) {
                            var data = result['data'];
                            $.each($vue.shiftLists, function (i, v) {
                                if (v.id == data.id) {
                                    $vue.$data.shiftLists[i].loadShiftOrgShops = data['loadShiftOrgShops'];
                                    return false;
                                }
                            });
                            $dbInnerManager.updateShift(loadShiftId, data, function () {
                                console.log("成功");
                            });
                            //$vue.$data.shiftLists[$vue.index] = result['data'];
                        });
                    },
                    zc: function (shift) {
                        /* if (!shift.loadShiftOrgShops || shift.loadShiftOrgShops.length == 0) {
                         native.showToast("该班次没有设置网点,请先设置网点");
                         return false;
                         }*/
                        analytics.onClickEvent(0x3030007)
                        Core.Cache.set('loadShift', shift);
                        Core.Page.changePage('scanOut.html', true);
                    },
                    showDetail: function (shift) {
                        Core.Cache.set('loadShift', shift);
                        Core.Page.changePage('fyCarDetail.html', true);
                    },
                    showSendCar: function (item) {
                        $vue.shift = JSON.parse(JSON.stringify(item));
                        Core.App.mainView.router.loadPage({pageName: "sendCar"});
                    },
                    fc: function () {
                        if ($vue.shift.shopId == "") {
                            native.showToast("请选择发货网点");
                            return false;

                        }
                        if (!$vue.shift.licensePlate || $vue.shift.licensePlate == "") {
                            native.showToast("请选择车牌");
                            return false;

                        }
                        if (!$vue.shift.driverName || $vue.shift.driverName == "") {
                            native.showToast("请选择司机");
                            return false;

                        }

                        Core.App.confirm("发车后会自动上传本地扫码并清空扫码!", "确认发车?", function () {
                            $dbInnerManager.findScanListByTRW(Core.ScanType.zc, $vue.shift['id'], $vue.shift['shopId'], function (scanList) {
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
                                    $vue.$data.batchNo = Core.Utils.getBatchNo(App.getBatchKey());
                                    Core.Service.post('api/auth/v1/ltl/sheetScanRecord/send', {
                                        batchNo: $vue.batchNo,
                                        loadShiftId: $vue.shift['id'],
                                        sendShopId: $vue.shift['shopId'],
                                        licensePlate: $vue.shift.licensePlate,
                                        driverName: $vue.shift.driverName,
                                        arriveShopId: "",
                                        text: text
                                    }, function () {
                                        if ($vue.shift['loadShiftOrgShops'] && $vue.shift['loadShiftOrgShops'].length > 0) {
                                            $dbInnerManager.clearLoadShift($vue.shift['id'], $vue.shift.shopId);
                                        }
                                        $dbInnerManager.clearScanListByTRW(Core.ScanType.zc, $vue.shift['id'], $vue.shift.shopId, function () {
                                            $vue.$data.batchNo = Core.Utils.getBatchNo(App.getBatchKey(), true);
                                            native.showToast('发车成功');
                                            $vue.shift = {};
                                            App.findShift();
                                            Core.Page.back();
                                        });
                                    });
                                });
                            });
                        });
                    },
                    cancleFc: function (shift) {
                        Core.App.confirm("确认取消发车?", function () {
                            Core.Service.post('api/auth/v1/ltl/loadShift/cancelSend', {
                                loadShiftId: shift.id
                            }, function () {
                                native.showToast('取消发车成功成功');
                                shift.isSend = 0;
                            });
                        });
                    }
                }
            });

            window.vv = $vue;
            this.initPageEvent();
            this.initEvents();
            today = new Date().GetDay(1, 'none');
            datePicker = Core.Utils.initRangeDatePicker("#range-time");
            var timeText = today + " - " + today;
            $('#range-time').val(timeText);
            this.findShift();
        },
        getBatchKey: function () {
            return Core.ScanType.zc + "_" + $vue.shift['id'] + "_" + $vue.shift['shopId'];
        },
        initPageEvent: function () {
            $$(document).on('pageInit', '.page[data-page="findLineBranch"]', function (e) {
                console.log("findLineBranch");
                App.findLineBranch();
            }).on('pageInit', '.page[data-page="findLicensePlate"]', function (e) {
                console.log("findLicensePlate");
                App.findLicensePlate();
            }).on('pageInit', '.page[data-page="findDriver"]', function (e) {
                console.log("findDriver");
                App.findDriver();
            });
        },
        findShift: function () {
            App.refreshShift();
        },
        /**
         * 刷新车次列表
         */
        refreshShift: function () {
            var rangeTimeArray = $('#range-time').val().split(' - ');
            var start = rangeTimeArray[0] + " 00:00:00";
            var end = (rangeTimeArray[1] ? rangeTimeArray[1] : rangeTimeArray[0] ) + " 23:59:59";
            Core.Service.get('api/auth/v1/ltl/loadShift/find', {
                isSend: "",
                privateFlag: $vue.privateFlag ? 1 : 0,
                beginTime: start,
                endTime: end
            }, function (result) {
                if (result['data']['rows'].length > 0) {
                    $vue.$data.shiftLists = result['data']['rows'];
                } else {
                    native.showToast("云端没有找到车次列表");
                    $vue.$data.shiftLists = [];
                }
            });
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
            console.log(tmp);
            var html = Core.Template.render('driverTmpl', tmp);
            $('.list-block-search').removeClass('hide');
            $("#findDriverContent").html(html);
        },
        initEvents: function () {
            $('body').on('click', '#findLineBranchPage .item-link', function () {
                var tmp = $(this).data('val');
                var tmp1 = {
                    lineBranchId: tmp['id'],
                    fromShopId: tmp['fromShopId'],
                    fromShopName: tmp['fromShopName'],
                    truckId: tmp['truckId'],
                    driverId: tmp['driverId'],
                    name: tmp['name'],
                    driverName: tmp['driverName'],
                    licensePlate: tmp['licensePlate']
                };
                $vue.$data.carInfo = tmp1;
                $("#ruleLineName").val(tmp['name']);
                $("#ruleLineId").val(tmp['id']);
                Core.App.mainView.back();
            }).on('click', '#findLicensePlatePage .item-link', function () {
                var tmp = $(this).data('val');
                $vue.$data.carInfo.licensePlate = tmp['licensePlate'];
                $vue.$data.carInfo.truckId = tmp['id'];
                $vue.$data.carInfo.driverName = tmp['driverName'];
                $vue.$data.carInfo.driverId = tmp['driverId'];
                if ('id' in $vue.shift) {
                    $vue.$data.shift.licensePlate = tmp['licensePlate'];
                    $vue.$data.shift.truckId = tmp['id'];
                    $vue.$data.shift.driverName = tmp['driverName'];
                    $vue.$data.shift.driverId = tmp['driverId'];
                }
                Core.App.mainView.back();
            }).on('click', '#findDriverPage .item-link', function () {
                var tmp = $(this).data('val');
                if ('id' in $vue.shift) {
                    $vue.$data.shift.driverName = tmp['name'];
                    $vue.$data.shift.driverId = tmp['id'];
                }
                $vue.$data.carInfo.driverName = tmp['name'];
                $vue.$data.carInfo.driverId = tmp['id'];
                Core.App.mainView.back();
            }).on('click', '#findFromShop  .searchbar-found  .item-link', function (e) {
                e.preventDefault();
                var shop = $(this).data('val');
                $vue.carInfo.fromShopId = shop['id'];
                $vue.carInfo.fromShopName = shop['name'];
                Core.mainView.router.back();
            }).on('refresh', '#fyCarListPage .pull-to-refresh-content', function () {
                App.findShift();
            }).on('refresh', '#findLineBranchPage .pull-to-refresh-content', function () {
                App.refreshLineBranch();
            }).on('refresh', '#findLicensePlatePage .pull-to-refresh-content', function () {
                App.refreshLicensePlate();
            }).on('refresh', '#findDriverPage .pull-to-refresh-content', function () {
                App.refreshDriver();
            }).on('click', '.getShift', function () {
                App.refreshShift();
            }).on('change', '#chooseTime', function () {
                var id = $(this).val();
                if (id == "custom") {
                    $('.chooseTime').show();
                    datePicker.open();
                } else {
                    var timeText = new Date().GetDay(id, "none") + " - " + today;
                    $('#range-time').val(timeText);
                    $('.chooseTime').hide();
                }
            });
        }
    };
    window.refresh = App.refreshShift;
    Core.init(App);
    module.exports = App;
});