/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var analytics = require('js/modules/core/analytics');

    var attributes = Core.Cache.get('attributes');
    var $vue;
    var datePicker;
    var today;
    var App = {
        init: function () {
            console.log("单车配载初始化成功");
            analytics.onPageEvent(0x2030004);

            $vue = new Vue({
                el: '#vueBound',
                data: {
                    shopId: attributes['orgId'],
                    shopName: attributes['orgName'],
                    loadShift: {},
                    shiftLists: []
                },
                watch: {
                    'shopId': function (val, oldVal) {
                        Core.Cache.set('lastScanShopId', val);
                        $vue.$data.shiftLists = [];
                        App.loadShiftOrg();
                    },
                    "shopName": function (val, oldVal) {
                        Core.Cache.set('lastScanShopName', val);
                    }
                },
                methods: {
                    getShifts: function () {
                        App.loadShiftOrg();
                    },
                    scanCar: function (item) {
                        Core.Cache.set('loadShift', item);
                        Core.Page.changePage('scanOutCar.html', true);
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
                        var loadShiftId = $vue.loadShift.loadShiftId;
                        Core.Service.post('api/auth/v1/ltl/loadShiftOrg/create', {
                            shopId: shopId,
                            loadShiftId: loadShiftId,
                            allowRule: "[]",
                            notAllowRule: "[]"
                        }, function (result) {
                            var data = result['data'];
                            debugger;
                            $.each($vue.shiftLists, function (i, v) {
                                if (v.loadShiftId == loadShiftId) {
                                    $vue.$data.shiftLists[i].loadShiftOrgShops = data['loadShiftOrgShops'];
                                    return false;
                                }
                            });
                        });
                    },
                    showDetail: function (shift) {
                        shift.type = "arrive";
                        Core.Cache.set('loadShift', shift);
                        Core.Page.changePage('fyCarDetail.html', true);
                    },
                    zc: function (shift) {
                        if (shift.loadShiftOrgShops.length == 0) {
                            native.showToast("该班次没有设置网点,请先设置网点");
                            return false;
                        }
                        Core.Cache.set('loadShift', Object.assign(shift, {
                            id: shift['loadShiftId'],
                            type: "scanAgain"
                        }));
                        Core.Page.changePage('scanOut.html', true);
                    },
                    arriveCar: function (shift) {
                        analytics.onClickEvent(0x303000B);
                        Core.Service.post('api/auth/v1/ltl/loadShiftOrg/arrive', {
                            loadShiftId: shift.loadShiftId,
                            shopId: shift.shopId
                        }, function () {
                            native.showToast('到达成功');
                            shift.isArrive = 1;
                        });
                    },
                    cancleArrive: function (shift) {
                        Core.App.confirm("确认取消到达?", function () {
                            Core.Service.post('api/auth/v1/ltl/loadShiftOrg/cancelArriveAndUnload', {
                                loadShiftId: shift.loadShiftId,
                                shopId: shift.shopId
                            }, function () {
                                native.showToast('取消到达卸车成功');
                                shift.isArrive = 0;
                            });
                        });
                    },
                    fc: function (shift) {
                        Core.Service.post('api/auth/v1/ltl/loadShiftOrg/send', {
                            loadShiftId: shift.loadShiftId,
                            shopId: shift.shopId
                        }, function () {
                            native.showToast('发车成功');
                            shift.isSend = 1;
                        });
                    },
                    cancleFc: function (shift) {
                        Core.App.confirm("确认取消发车?", function () {
                            Core.Service.post('api/auth/v1/ltl/loadShiftOrg/cancelSend', {
                                loadShiftId: shift.loadShiftId,
                                shopId: shift.shopId
                            }, function () {
                                native.showToast('取消发车成功成功');
                                shift.isSend = 0;
                            });
                        });
                    }
                }
            });
            this.initEvents();
            today = new Date().GetDay(1, 'none');
            datePicker = Core.Utils.initRangeDatePicker("#range-time");
            var timeText = new Date().GetDay(2, 'none') + " - " + today;
            $('#range-time').val(timeText);
            this.loadShiftOrg();
        },
        loadShiftOrg: function () {
            if (this.shopId == 0) {
                native.showToast("请选择网点");
                return false;
            }
            var rangeTimeArray = $('#range-time').val().split(' - ');
            var start = rangeTimeArray[0] + " 00:00:00";
            var end = (rangeTimeArray[1] ? rangeTimeArray[1] : rangeTimeArray[0] ) + " 23:59:59";
            Core.Service.get('api/auth/v1/ltl/loadShiftOrg/find', {
                //shopId: $vue.shopId,
                beginTime: start,
                endTime: end,
                privateFlag: 0
            }, function (result) {
                if (result['data']['rows'].length > 0) {
                    $vue.$data.shiftLists = result['data']['rows'];
                } else {
                    native.showToast("云端没有找到该网点的车次列表");
                }
            });
        },
        initEvents: function () {
            $('body').on('click', '#findLineBranchPage .item-link', function () {
                var tmp = $(this).data('val');
                var tmp1 = {
                    lineBranchId: tmp['id'],
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
                console.log(tmp);
                Core.App.mainView.back();
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
    window.refresh = App.loadShiftOrg;
    Core.init(App);
    module.exports = App;
});