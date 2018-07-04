/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var $ = window.$;
    var _ = window._;
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var analytics = require('js/modules/core/analytics');

    var $dbInnerManager = require('js/modules/manager/dbInnerManager');
    var laytpl = require('js/modules/core/laytpl');
    var sheetPre = Core.Cache.get('sheetPre');
    var $vue;
    var block = false;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            analytics.onPageEvent(0x2030006);
            Core.App.searchView = Core.App.addView('.view-search', {
                domCache: true,
                dynamicNavbar: true
            });
            var config = Core.Utils.getConfig();

            $vue = new Vue({
                el: '#vueBound',
                data: {
                    inputSheetNo: "",
                    sheetNo: "",
                    codeScanInfo: {},
                    scanList: [],
                    chooseCard: "",
                    customerBank: config['customerBank'],
                    chooseCardList: [],
                    codSendInfo: {
                        cash: 1,
                        fromCustomerBank: "",
                        fromCustomerHolder: "",
                        fromCustomerAccount: ""
                    },
                    cod: 0,
                    codPayFee: 0,
                    codFee: 0,
                    searchSheetNoInput: "",
                    searchPreNo: "",
                    searchNo: "",
                    searchResult: ""
                },
                computed: {},
                watch: {
                    sheetNo: function (val) {
                        $vue.inputSheetNo = "";
                        if (val) {
                            var time = (new Date()).Format("yyyy-MM-dd hh:mm:ss");
                            var params = {
                                createTime: time,
                                sheetNo: val
                            };
                            App.renderScanList(params);
                            $vue.sheetNo = "";
                        }
                    },
                    chooseCard: function (val) {
                        if (val) {
                            var cardInfo = JSON.parse(val);
                            Object.assign($vue.codSendInfo, cardInfo)
                        } else {
                            Object.assign($vue.codSendInfo, {
                                fromCustomerBank: $vue.customerBank[0]['value'],
                                fromCustomerHolder: "",
                                fromCustomerAccount: ""
                            });
                        }
                    },
                    scanList: function () {
                        App.countFee();
                    }
                },
                methods: {
                    sendScan: function () {
                        if (!$vue.codSendInfo.cash) {
                            if (!$vue.codSendInfo.fromCustomerBank || !$vue.codSendInfo.fromCustomerHolder || !$vue.codSendInfo.fromCustomerAccount) {
                                native.showToast('非现金方式,请填写或者选择完整的银行卡信息');
                                return false;
                            }
                        }
                        var that = this;
                        if (that.scanList.length == 0) {
                            native.showToast('没有任何运单');
                            return false;
                        }
                        Core.App.confirm("是否确认提交?", function () {
                            var tmp = [];
                            $.each(that.scanList, function (i, v) {
                                tmp.push(v['id']);
                            });
                            Core.Service.post('api/auth/v1/ltl/sheetCod/codPrepay', Object.assign({
                                sheetIds: tmp
                            }, $vue.codSendInfo), function (result) {
                                native.showToast('提交成功');
                                $dbInnerManager.updateCodeScan(1, {
                                    "state": 1,
                                    "preNo": result['data']
                                }, function () {
                                    $vue.codeScanInfo.state = 1;
                                    $vue.codeScanInfo.preNo = result['data'];
                                    Core.Page.back();
                                });
                            });
                        });
                    },
                    clear: function () {
                        Core.App.confirm("确定清空扫码记录", '温馨提示', function () {
                            App.clearScanList();
                        });
                    },
                    removeScan: function (scan) {
                        var that = this;
                        Core.App.confirm("确定删除这条运单", '温馨提示', function () {
                            var tmp = JSON.parse(JSON.stringify($vue.scanList));
                            var obj = JSON.parse(JSON.stringify(scan));
                            $.each(tmp, function (i, v) {
                                if (v['sheetNo'] == obj['sheetNo']) {
                                    tmp.remove(i);
                                    return false;
                                }
                            });
                            $dbInnerManager.updateCodeScan(1, {
                                scanList: tmp
                            }, function () {
                                that.scanList.$remove(scan);
                            });
                        });
                    },
                    addScan: function () {
                        if ($vue.inputSheetNo.length < sheetLength) {
                            native.showToast("请输入最少" + sheetLength + "运单号");
                            return false;
                        }
                        $vue.sheetNo = sheetPre + $vue.inputSheetNo;
                    },
                    print: function (preNo) {
                        App.getCodPrint(preNo, function (content) {
                            content.printCount = Core.Cache.get("codPrintCount") * 1 || 0;
                            App.print(content, true);
                        });
                    },
                    printResult: function (content) {
                        content.printCount = 1;
                        App.print(content);
                    },
                    searchCodPrint: function () {
                        if (!$vue.searchSheetNoInput && !$vue.searchPreNo) {
                            native.showToast("请输入运单号或者转款编码");
                            return false;
                        }
                        App.searchCodPrint($vue.searchPreNo ? $vue.searchPreNo : sheetPre + $vue.searchSheetNoInput);
                    }
                }
            });
            this.initEvent();
            this.initScanList();
            document.addEventListener('getScan', App.addScanFromNative, false);
        },
        searchCodPrint: function (no) {
            App.getCodPrint(no, function (content) {
                $vue.searchResult = content;
            });
        },
        clearScanList: function () {
            $vue.scanList = [];
            $vue.codSendInfo = {
                cash: 1,
                fromCustomerBank: "",
                fromCustomerHolder: "",
                fromCustomerAccount: ""
            };
            $vue.codSendInfo.cash = 1;
            Core.Cache.remove("codPrintCount");
            $dbInnerManager.updateCodeScan(1, {
                scanList: [],
                state: 0,
                preNo: ""
            }, function () {
                $vue.codeScanInfo.state = 0;
                $vue.codeScanInfo.preNo = "";
            });
        },
        initScanList: function () {
            $vue.scanList = [];
            $dbInnerManager.getCodScan(function (result) {
                $vue.codeScanInfo = result;
                $vue.scanList = result['scanList'];
            });
        },
        initEvent: function () {
            $$(document).on('pageAfterAnimation', '.page[data-page="preSend"]', function () {
                $vue.chooseCardList = [];
                if ($vue.scanList.length > 0) {
                    $.each($vue.scanList, function (i, v) {
                        if (v['fromCustomerAccount'] != "") {
                            var flag = false;
                            if ($vue.chooseCardList.length > 0) {
                                $.each($vue.chooseCardList, function (i1, v1) {
                                    if (v1['fromCustomerAccount'] == v['fromCustomerAccount']) {
                                        flag = true;
                                        return false;
                                    }
                                });
                            }
                            if (!flag) {
                                $vue.chooseCardList.push({
                                    fromCustomerBank: v['fromCustomerBank'],
                                    fromCustomerAccount: v['fromCustomerAccount'],
                                    fromCustomerHolder: v['fromCustomerHolder']
                                })
                            }
                        }
                    })
                }
            });
        },
        /**
         * 客户的扫码事件
         * @param e
         * @returns {boolean}
         */
        addScanFromNative: _.throttle(function (e) {
            var sheetLabelNo = Core.Utils.getSheetNoFromScan(e.detail['sheetLabelNo']);
            if (sheetLabelNo === "") {
                return false;
            }
            var no = sheetLabelNo.length > Core.Utils.getSheetFullLength() ? Core.Utils.getSheetNo(sheetLabelNo) : sheetLabelNo;
            if (Core.App.mainView.activePage.name == 'codList' && !$vue.codeScanInfo.state) {
                $vue.sheetNo = no;
            }
            if ($(".view.view-search.active").length > 0) {
                $vue.searchSheetNoInput = Core.Utils.getShortSheetNo(no);
            }

        }, 100),
        checkList: function (sheetNo) {
            var flag = false;
            if ($vue.scanList.length > 0) {
                $.each($vue.scanList, function (i, v) {
                    if (v['sheetNo'] === sheetNo) {
                        flag = true;
                        return false;
                    }
                });
            }
            if (flag) {
                native.mediaVibrate(Core.ScanCode.error, "重复扫码");
                block = false;
                return false;
            }
            return true;
        },
        /**
         * 选择本地扫码列表
         * @param params
         */
        renderScanList: function (params) {
            if (!params['sheetNo'].startsWith(sheetPre)) {
                native.mediaVibrate(Core.ScanCode.notRead, "不识别条码");
                return false;
            }
            if (!block) {
                block = true;
                if (!App.checkList(params['sheetNo'])) {
                    return false;
                }
                Core.Service.get('api/auth/v1/ltl/sheetCod/getBySheetNo', {
                    sheetNo: params['sheetNo']
                }, function (result) {
                    if (result['data']) {
                        var sheet = result['data'];
                        sheet.state = 'success';
                        $vue.scanList.unshift(sheet);
                        $dbInnerManager.updateCodeScan(1, {
                            scanList: $vue.scanList
                        }, function () {
                            block = false;
                            native.mediaVibrate(Core.ScanCode.ok, "");
                        });
                    }
                }, function (message) {
                    block = false;
                    native.mediaVibrate(Core.ScanCode.error, message);
                    // native.showToast(message);
                });
            }
        },
        countFee: function () {
            if ($vue.scanList.length > 0) {
                var cod = 0;
                var codPayFee = 0;
                var codFee = 0;
                $.each($vue.scanList, function (i, v) {
                    cod += v['cod'] * 1;
                    codPayFee += v['codPayFee'] * 1;
                    codFee += v['codFee'] * 1;
                });
                $vue.cod = cod;
                $vue.codPayFee = codPayFee;
                $vue.codFee = codFee;
            } else {
                $vue.cod = 0;
                $vue.codPayFee = 0;
                $vue.codFee = 0;
            }
        },
        /**
         * 获取凭证打印内容
         * @param no
         * @param cb
         */
        getCodPrint: function (no, cb) {
            var params = {
                codPrepayNo: "",
                sheetNo: ""
            };
            if (Core.Utils.isMySheet(no)) {
                params.sheetNo = no;
            } else {
                params.codPrepayNo = no;
            }
            Core.Service.get('api/auth/v1/ltl/sheetCod/getCodPrint', params, function (result) {
                var content = result['data'];
                cb(content);
            });
        },
        print: function (content, isAdd) {
            var print = Core.Utils.getPrintSetting();
            if (print) {
                var deviceType = Core.Utils.getDeviceType(print);
                var configName = "Sheet.codPrepay.template";
                if (!deviceType || !configName) {
                    native.showToast("打印机型号或者打印模板不存在");
                    return false;
                }
                Core.Utils.getPrintTemplate(configName, deviceType, function (result) {
                    var tpl = result['content'];

                    console.log(content.printCount);
                    var html = laytpl(tpl).render(content);
                    console.log(html);
                    native.printList(print['address'], deviceType, [{
                        start: 1,
                        end: 1,
                        html: Base64.encode(html)
                    }], function () {
                        if (isAdd) {
                            Core.Cache.set("codPrintCount", content.printCount + 1)
                        }
                    });
                });
            }
        }
    };
    Core.init(App);
    window.addScanFromNative = App.addScanFromNative;
    module.exports = App;
});