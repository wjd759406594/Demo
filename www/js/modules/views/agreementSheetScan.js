/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var $ = window.$;
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var $dbInnerManager = require('js/modules/manager/dbInnerManager');
    var scanDetail;
    var agreement;
    var $vue;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    batchNo: "",
                    sheetNo: "",
                    agreementInfo: {},
                    scanList: []
                },
                methods: {
                    findAgreement: function () {
                        var agreementNo = $vue.agreementNo + "";
                        if (agreementNo.length == "") {
                            native.showToast('请输入月结编号');
                            return false;
                        }
                        Core.Service.get('api/auth/v1/ltl/agreement/getByNo', {
                            agreementNo: agreementNo
                        }, function (result) {
                            if (result['data']) {
                                $vue.company = result['data']['company'];
                                $vue.price = result['data']['fee'];
                            } else {
                                native.showToast('未找到月结单位');
                            }
                        });
                    },
                    sendScan: function () {
                        var that = this;
                        if (that.scanList.length == 0) {
                            native.showToast('没有任何扫码');
                            return false;
                        }
                        var tmp = [];
                        $.each(that.scanList, function (i, v) {
                            var obj = {
                                s: v['sheetNo'],
                                d: v['createTime']
                            };
                            tmp.push(obj);
                        });
                        var data = {
                            no: $vue.agreementInfo.no,
                            fee: $vue.agreementInfo.fee,
                            list: tmp
                        };
                        console.log(data);
                        native.dataCompress(data, function (text) {
                            Core.Service.post('api/auth/v1/ltl/sheetConsign/saveConsignSheet', {
                                batchNo: $vue.batchNo,
                                text: text
                            }, function (result) {
                                var tmp = [];
                                if (result['data'].length > 0) {
                                    var message = "扫码上传成功<br>";
                                    $.each(result['data'], function (k, v) {
                                        message += v['s'] + ":" + v['d'] + "<br>";
                                        var time = (new Date()).Format("yyyy-MM-dd hh:mm:ss");
                                        var params = {
                                            createTime: time,
                                            message:v['d'],
                                            sheetNo: v['s']
                                        };
                                        tmp.push(params);
                                    });
                                    native.showToast(message);
                                } else {
                                    native.showToast("扫码上传成功");
                                }
                                $dbInnerManager.updateAgreement(agreement.id, {
                                    scanList: tmp
                                }, function () {
                                    $vue.scanList = tmp;
                                    $vue.batchNo = Core.Utils.getBatchNo(App.getBatchKey(), true);
                                });
                            });
                        });
                    },
                    removeScan: function (scan) {
                        var that = this;
                        Core.App.confirm("确定删除这条运单记录", '温馨提示', function () {
                            var tmp = JSON.parse(JSON.stringify($vue.scanList));
                            var obj = JSON.parse(JSON.stringify(scan));
                            console.log(tmp.length);
                            $.each(tmp, function (i, v) {
                                if (v['sheetNo'] == obj['sheetNo']) {
                                    tmp.remove(i);
                                    return false;
                                }
                            });
                            $dbInnerManager.updateAgreement(agreement.id, {
                                scanList: tmp
                            }, function () {
                                that.scanList.$remove(scan);
                            });
                        });
                    },
                    clear: function () {
                        Core.App.confirm("确定清空运单记录", '温馨提示', function () {
                            $dbInnerManager.updateAgreement(agreement.id, {
                                scanList: []
                            }, function () {
                                $vue.scanList = [];
                            });
                        });
                    },
                    reset: function () {
                        Core.App.confirm("确定重置批次号", '温馨提示', function () {
                            $vue.batchNo = Core.Utils.getBatchNo(App.getBatchKey(), true);
                        });
                    },
                    addScan: function () {
                        if ($vue.sheetNo == "") {
                            native.showToast("请输入运单号");
                            return false;
                        }
                        var time = (new Date()).Format("yyyy-MM-dd hh:mm:ss");
                        var params = {
                            createTime: time,
                            sheetNo: $vue.sheetNo
                        };
                        native.mediaVibrate(Core.ScanCode.ok, "");
                        App.renderScanList(params);
                        $vue.sheetNo = "";
                        Core.Page.back();
                    }
                }
            });
            this.initEvent();
            this.initScanList();
            document.addEventListener('getScan', App.addScanFromNative, false);
        },
        initScanList: function () {
            agreement = Core.Cache.get("lastAgreement");
            if (!agreement) {
                native.showToast("未找到月结单位");
                Core.Page.back();
                return false;
            }
            $vue.agreementInfo = agreement;
            $vue.scanList = [];
            $vue.batchNo = Core.Utils.getBatchNo(App.getBatchKey());

            $dbInnerManager.findAgreementById(agreement.id, function (result) {
                $vue.scanList = result['scanList'];
            });
        },
        getBatchKey: function () {
            return Core.ScanType.yj + "_" + $vue.agreementInfo.no;
        },
        initEvent: function () {
            $("body").on('click', '.showScan', function () {
                scanDetail = $(this).data('val');
                Core.Page.changePage('scanDetail.html');
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
            var time = (new Date()).Format("yyyy-MM-dd hh:mm:ss");
            var params = {
                createTime: time,
                sheetNo: sheetLabelNo
            };
            native.mediaVibrate(Core.ScanCode.ok, "");
            App.renderScanList(params);
        },
        /**
         * 选择本地扫码列表
         * @param params
         */
        renderScanList: function (params) {
            if (params['sheetNo'].length > 40 || params['sheetNo'].startsWith("http")) {
                native.mediaVibrate(Core.ScanCode.notRead, "不识别条码");
                return false;
            }
            var flag = false;
            if ($vue.scanList.length > 0) {
                $.each($vue.scanList, function (i, v) {
                    if (v['sheetNo'] == params['sheetNo']) {
                        flag = true;
                        return false;
                    }
                });
            }
            if (flag) {
                native.mediaVibrate(Core.ScanCode.error, "重复扫码");
                return false;
            }

            var tmp = JSON.parse(JSON.stringify($vue.scanList));
            tmp.unshift(params);
            $dbInnerManager.updateAgreement(agreement.id, {
                scanList: tmp
            }, function () {
                $vue.scanList.unshift(params);
            });
        }
    };
    Core.init(App);
    window.refresh = App.initScanList;
    module.exports = App;
});