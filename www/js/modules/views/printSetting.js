/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var analytics = require('js/modules/core/analytics');

    var $vue;
    var WaybillCount = Core.Cache.get('WaybillCount');
    var printSet = Core.Cache.get('printSet') || {address: 0};
    var App = {
        init: function () {
            var that = this;
            App.findByType(function () {
                console.log("初始化成功");
                analytics.onPageEvent(0x2030008);

                if (!WaybillCount) {
                    Core.Cache.set('WaybillCount', 1);
                    WaybillCount = 1;
                }

                //迁移老配置
                if (Core.Cache.get('printSetVersion') != "1.0.0") {
                    Core.Cache.set('printSetVersion', '1.0.0');
                    var bh = Core.Cache.get('WaybillBh');
                    if (bh) {
                        printSet = bh;
                        Core.Cache.set('printSet', bh);
                        Core.Cache.remove('WaybillBh');
                        Core.Cache.remove('WaybillBq');
                        Core.Cache.remove('WaybillMd');
                        Core.Cache.remove('WaybillMdt');
                    }
                }

                var option = '<option value="0">请选择打印机型号</option>';
                $.each(Core.PrintModList, function (i, v) {
                    option += '<option value="' + v['id'] + '">' + v['name'] + '</option>';
                });
                $vue = new Vue({
                    el: '#fastKpPage',
                    data: {
                        blueList: [],
                        printSet: printSet,
                        option: option,
                        WaybillCount: WaybillCount,
                        printMod: Core.Cache.get('printMod') || 2
                    },
                    watch: {
                        "WaybillCount": function (val) {
                            Core.Cache.set("WaybillCount", val);
                        },
                        "printMod": function (val) {
                            Core.Cache.set('printMod', val);
                        },
                        "printSet.mod": function (value) {
                            Core.Cache.set("printSet", $vue.printSet);
                            var mod = {};
                            if (value != 0) {
                                $.each(Core.PrintModList, function (k, v) {
                                    if (v['id'] == value) {
                                        mod = v;
                                    }
                                });
                            }
                            Core.Cache.set('printModSet', mod);
                            console.log(Core.Cache.get('printModSet'));
                        },
                        "printSet.address": function (value) {
                            console.log(value);
                            if (value !== 0) {
                                var buleList = JSON.parse(JSON.stringify($vue.blueList));
                                $.each(buleList, function (i, v) {
                                    if (v['address'] == value) {
                                        console.log(v);
                                        Core.Service.get('api/auth/v1/boss/device/validDevice', {
                                            mac: v['address'],
                                            name: v['name'],
                                            type: v['mod']
                                        }, function () {
                                            Core.Cache.set("printSet", v);
                                            $vue.printSet = v;
                                        }, function (err) {
                                            App.clearBound();
                                            if (err['message']) {
                                                Core.App.alert(err['message']);
                                            }
                                        });
                                        return false;
                                    }
                                });
                            } else {
                                App.clearBound();
                            }
                        }
                    },
                    methods: {
                        initList: function () {
                            App.initList(true);
                        },
                        scan: function () {
                            App.scan();
                        },
                        connect: function () {
                            analytics.onClickEvent(0x3030017);
                            if ($vue.printSet.address != 0) {
                                native.connectBluetooth($vue.printSet.address);
                            } else {
                                native.showToast('请先选择打印机');
                            }
                        },
                        stop: function () {
                            analytics.onClickEvent(0x3030018);
                            native.stopBluetooth();
                        }
                    }
                });
                that.initEvents();
                that.initList();
                window.refresh =  App.initList;
            });
        },
        scan: function () {
            App.clearBound();
            native.bluetoothSetting(function (lists) {
                App.renderList(lists);
            });
        },
        clearBound: function () {
            $vue.printSet = {address: 0};
            $vue.printMod = 2;
            Core.Cache.remove("printSet");
        },
        renderList: function (lists) {
            if (lists.length > 0) {
                $vue.blueList = lists;
            } else {
                Core.App.alert("没有找到蓝牙打印机", function () {
                    App.scan();
                });
            }
        },
        findByType: function (cb) {
            Core.Service.get('api/auth/v1/sys/dict/findByType', {
                type: 'app_print_type'
            }, function (result) {
                if (result['data']) {
                    if (result['data'].length > 0) {
                        Core.PrintModList = [];
                        result['data'].map(function (item) {
                            var i = {
                                id: item['sort'],
                                name: item['label'],
                                deviceType: item['value']
                            };
                            Core.PrintModList.push(i);
                        });
                    }
                } else {
                    native.showToast("没有找到任何数据");
                }
                console.log(Core.PrintModList);
                cb();
            }, function (err) {
                console.log(err);

                Core.PrintModList = [
                    {
                        id: 1,
                        deviceType: "LPK130",
                        name: "富士通LPK130"
                    },
                    {
                        id: 2,
                        deviceType: "GP3120TL",
                        name: "佳博GP3120TL"
                    },
                    {
                        id: 3,
                        deviceType: "HMZ3",
                        name: "我的物流云M8"
                    },
                    {
                        id: 4,
                        deviceType: "XT4131A",
                        name: "芝柯XT4131A"
                    }
                ];

                cb();
            });
        },
        initList: function () {
            native.getBluetoothInfo(function (lists) {
                App.renderList(lists);
            });
        },
        initEvents: function () {

        }
    };
    Core.init(App);
    module.exports = App;
});