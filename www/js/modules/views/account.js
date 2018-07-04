/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var attributes = Core.Cache.get('attributes');
    var $vue;
    var App = {
        init: function () {
            console.log("初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    consumer: "",
                    in: {
                        detail: "",
                        money: ""
                    },
                    out: {
                        detail: "",
                        money: ""
                    },
                    sqList: []
                },
                watch: {},
                methods: {
                    submitCz: function (validate) {
                        if (App.validate(validate)) {
                            App.applyTrade(2);
                        }
                    },
                    submitTx: function (validate) {
                        if (App.validate(validate)) {
                            App.applyTrade(3);
                        }
                    }
                }
            });
            App.getConsumer();
            $("body").on('pageAfterAnimation', '.page[data-page="account"]', function () {
                $vue.in = {
                    detail: "",
                    money: Math.abs($vue.consumer['remain'])
                };
                $vue.out = {
                    detail: "",
                    money: ""
                };
            }).on('pageAfterAnimation', '.page[data-page="sqList"]', function () {
                App.getSqList();
            }).on('refresh', '#sqList', function () {
                App.getSqList();
            }).on('refresh', '#account', function () {
                App.getConsumer();
            }).on('click', ".sqTx", function () {
                native.showToast("暂未开放");
            });
        },
        getSqList: function () {
            Core.Service.get('api/auth/v1/sap/consumerTrade/find', {}, function (result) {
                console.log(result);
                if (result['data'] && result['data']['rows'].length > 0) {
                    $vue.sqList = result['data']['rows'];
                } else {
                    native.showToast("暂无数据");
                }
            });
        },
        applyTrade: function (type) {
            var money, detail;
            var message = "";
            if (type == 2) {
                message = "充值";
                money = $vue.in.money;
                detail = $vue.in.detail;
            } else {
                message = "提现";
                money = $vue.out.money;
                detail = $vue.out.detail;
            }

            if(money*1 <0){
                native.showToast("金额不能小于0");
                return false;
            }

            Core.App.confirm("是否确认申请" + message + money + "元", function () {
                Core.Service.post('api/auth/v1/sap/consumerTrade/apply', {
                    type: type,
                    money: money,
                    detail: detail
                }, function () {
                    native.showToast("申请成功");
                    if (type == 1) {
                        $vue.in = {
                            detail: "",
                            money: 100
                        }
                    } else {
                        $vue.out = {
                            detail: "",
                            money: 2500
                        }
                    }

                    Core.Page.back();
                });
            });
        },
        /**
         * 统一验证错误提示
         * @param validate
         * @returns {boolean}
         */
        validate: function (validate) {
            var flag = true;
            if (!validate.valid) {
                var errors = validate.errors;
                $.each(errors, function (i, v) {
                    native.showToast(v['message']);
                    flag = false;
                    return false;
                });
            }
            return flag;
        },
        /**
         *获取余额
         */
        getConsumer: function () {
            $vue.report = "";
            Core.Service.get('api/auth/v1/sap/consumer/getConsumer', {}, function (result) {
                if (result['data']) {
                    $vue.consumer = result['data'];
                    $vue.in = {
                        detail: "",
                        money: Math.abs($vue.consumer['remain'])
                    };
                } else {
                    native.showToast("没有找到任何数据");
                }
            });
        }
    };
    Core.init(App);
    module.exports = App;
});