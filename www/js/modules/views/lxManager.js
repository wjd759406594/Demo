/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var analytics = require('js/modules/core/analytics');

    var lxDb = Core.lxDb;
    var IDB = lxDb.getIDB(Core.Cache.get('companyNo'));
    var native = require('js/modules/hybridapi');
    var $vue;
    var App = {
        init: function () {
            analytics.onPageEvent(0x2030009);
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    show: true,
                    seq: []
                },
                watch: {},
                methods: {
                    sync: _.throttle(function (name, syncAll) {
                        if (syncAll) {
                            analytics.onClickEvent(0x3030015);
                        } else {
                            analytics.onClickEvent(0x3030016);
                        }

                        switch (name) {
                            case "region":
                                lxDb.syncRegion(syncAll, true, function () {
                                    native.showToast("同步到货区域成功");
                                    App.getList();
                                });
                                break;
                            case "org":
                                lxDb.syncOrg(syncAll, true, function () {
                                    native.showToast("同步机构区域成功");
                                    App.getList();
                                });
                                break;
                            case "agreement":
                                lxDb.syncAgreement(syncAll, true, function () {
                                    native.showToast("同步月结单位成功");
                                    App.getList();
                                });
                                break;
                            case "print":
                                lxDb.syncPrint(syncAll, true, function () {
                                    native.showToast("同步打印模板成功");
                                    App.getList();
                                });
                                break;
                            case "dict":
                                lxDb.syncDict(syncAll, true, function () {
                                    native.showToast("同步字典成功");
                                    App.getList();
                                });
                                break;
                            case "config":
                                lxDb.syncConfig(syncAll, true, function () {
                                    native.showToast("同步系统配置成功");
                                    App.getList();
                                });
                                break;
                            case "feeRule":
                                lxDb.syncFeeRule(syncAll, true, function () {
                                    native.showToast("同步费用规则成功");
                                    App.getList();
                                });
                                break;
                        }
                    }, 100),
                    syncAll: _.throttle(function () {
                        analytics.onClickEvent(0x3030014);
                        Core.App.showIndicator();
                        lxDb.syncRegion(false, false, function () {
                            lxDb.syncOrg(false, false, function () {
                                lxDb.syncAgreement(false, false, function () {
                                    lxDb.syncPrint(false, false, function () {
                                        lxDb.syncDict(false, false, function () {
                                            lxDb.syncConfig(false, false, function () {
                                                lxDb.syncFeeRule(false, false, function () {
                                                    Core.App.hideIndicator();
                                                    native.showToast("同步成功");
                                                    App.getList();
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    }, 100)
                }
            });
            this.getList();
        },
        getList: _.throttle(function () {
            IDB.transaction('r', IDB.region, IDB.agreement, IDB.print, IDB.dict, IDB.config, IDB.feeRule, IDB.seq, function () {
                IDB.seq.toArray().then(function (seq) {
                    $vue.$data.seq = seq;
                });
            }).catch(function (e) {
                Core.App.alert("获取静态数据出错" + e['message']);
                console.log(e);
            })
        }, 100)
    };
    Core.init(App);
    window.IDB = IDB;
    module.exports = App;
});