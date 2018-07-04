/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var $dbInnerManager = require('js/modules/manager/dbInnerManager');
    var $vue;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    agreementInfo: {
                        no: '',
                        company: '',
                        id: "",
                        fee: ""
                    },
                    agreementList: []
                },
                methods: {
                    findAgreement: function () {
                        var agreementNo = $vue.agreementInfo.no + "";
                        if (agreementNo.length == "") {
                            native.showToast('请输入月结编号');
                            return false;
                        }
                        Core.Service.get('api/auth/v1/ltl/agreement/getByNo', {
                            agreementNo: agreementNo
                        }, function (result) {
                            if (result['data']) {
                                $vue.agreementInfo.company = result['data']['company'];
                                $vue.agreementInfo.fee = result['data']['fee'];
                                $vue.agreementInfo.id = result['data']['id'];
                            } else {
                                native.showToast('未找到月结单位');
                            }
                        });
                    },
                    add: function (validation) {
                        if (validation.invalid) {
                            native.showToast(validation["errors"][0].message);
                            return false;
                        }
                        var param = JSON.parse(JSON.stringify($vue.agreementInfo));
                        param.scanList = [];
                        $dbInnerManager.addAgreement(param, function () {
                            $vue.agreementList.unshift(param);
                            native.showToast("[" + param['company'] + "]添加成功");
                            Core.Page.back();
                        });
                    },
                    remove: function (item) {
                        Core.App.confirm("确认删除当前月结单位(会清空本地全部扫码)", function () {
                            $dbInnerManager.removeAgreement(item.id, function () {
                                $vue.agreementList.$remove(item);
                            });
                        });
                    },
                    openScan: function (item) {
                        Core.Cache.set("lastAgreement", item);
                        Core.Page.changePage('agreementSheetScan.html', true);
                    }
                }
            });
            this.initEvents();
            this.findAgreementList();
        },
        initEvents: function () {
            $("body").on('refresh', '#agreementList', function () {
                App.findAgreementList();
            })
        },
        findAgreementList: function () {
            Core.App.showPreloader();
            $dbInnerManager.findAgreementList(function (result) {
                $vue.agreementList = result;
                setTimeout(function () {
                    Core.App.hidePreloader();
                    Core.App.pullToRefreshDone();
                }, 800);
            });
        }
    };
    Core.init(App);
    // window.refresh = App.findAgreementList;
    // window.reload = App.findAgreementList;
    module.exports = App;
});