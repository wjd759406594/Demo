/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var $sheet = require('js/modules/manager/fastSheetConfig');
    var attributes = Core.Cache.get('attributes');
    var $dbInnerManager = require('js/modules/manager/dbInnerManager');
    var native = require('js/modules/hybridapi');
    var $vue;
    var today, datePicker;
    var App = {
        init: function () {
            console.log("单车配载初始化成功");
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
                        driverPhone:"",
                        licensePlate: ""
                    },
                    privateFlag: 1,
                    loadShift: {},
                    loadIndex: "",
                    shiftLists: []
                },
                watch: {},
                methods: {
                    /**
                     * 创建
                     * @returns {boolean}
                     */
                    createShift: function () {
                        if ($vue.carInfo.shopId == "") {
                            native.showToast("请选择发货网点");
                            return false;

                        }
                        Core.Service.post('api/auth/v1/ltl/deliveryTask/create', {
                            deliveryShopId: $vue.carInfo.fromShopId,
                            driverName:  $vue.carInfo.driverName,
                            driverPhone:  $vue.carInfo.driverPhone,
                            licensePlate:$vue.carInfo.licensePlate
                        }, function (result) {
                            native.showToast("新建成功");
                            $vue.carInfo = {
                                lineBranchId: "",
                                fromShopId: attributes['orgId'],
                                fromShopName: attributes['orgName'],
                                truckId: "",
                                driverId: "",
                                name: "",
                                driverName: "",
                                driverPhone:"",
                                licensePlate: ""
                            };
                            $vue.shiftLists.unshift(result['data']);
                            Core.Page.back();
                        });

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
                    zc: function (task) {
                        Core.Cache.set('deliveryTask', task);
                        Core.Page.changePage('deliveryScan.html', true);
                    },
                    showList:function (task) {
                        task.type = "task";
                        Core.Cache.set('loadShift', task);
                        Core.Page.changePage('fyCarDetail.html', true);
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

            Core.Service.get('api/auth/v1/ltl/deliveryTask/find', {
                privateFlag: $vue.privateFlag ? 1 : 0,
                beginTime: start,
                endTime: end
            }, function (result) {
                if (result['data']['rows'].length > 0) {
                    $vue.shiftLists = result['data']['rows'];
                } else {
                    native.showToast("云端没有找到车次列表");
                    $vue.shiftLists = [];
                }
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
                    driverPhone:tmp['driverPhone'],
                    licensePlate: tmp['licensePlate']
                };
                $vue.carInfo = tmp1;
                Core.App.mainView.back();
            }).on('click', '#findLicensePlatePage .item-link', function () {
                var tmp = $(this).data('val');
                $vue.carInfo.licensePlate = tmp['licensePlate'];
                $vue.carInfo.truckId = tmp['id'];
                $vue.carInfo.driverName = tmp['driverName'];
                $vue.carInfo.driverId = tmp['driverId'];
                $vue.carInfo.driverPhone = tmp['driverPhone'];
                Core.App.mainView.back();
            }).on('click', '#findDriverPage .item-link', function () {
                var tmp = $(this).data('val');
                $vue.carInfo.driverName = tmp['name'];
                $vue.carInfo.driverId = tmp['id'];
                $vue.carInfo.driverPhone = tmp['driverPhone'];
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