/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var attributes = Core.Cache.get('attributes');
    var Oss = require('js/modules/manager/oss');
    var $vue;
    var App = {
        init: function () {
            this.initConfig();
            console.log("初始化成功");
            Oss.init();
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    fee: {
                        sheetNoShort: "",
                        applyType: "",
                        cod: "",
                        pickPayFee: "",
                        toPremium: "",
                        toBackSheetFee: "",
                        toReceiptFee: "",
                        toDeliveryFee: "",
                        photo1:"",
                        photo2:"",
                        photo3:""
                    },
                    sqList: []
                },
                watch: {},
                methods: {
                    apply: function (validate) {
                        if (App.validate(validate)) {
                            App.apply(3);
                        }
                    },
                    scanQr:function () {
                        native.scanQr();
                    }
                }
            });

            $("body").on('pageAfterAnimation', '.page[data-page="sqList"]', function () {
                App.getSqList();
            }).on('refresh', '#sqList', function () {
                App.getSqList();
            });
            document.addEventListener('getScan', App.getQR, false);
            document.addEventListener('getQR', App.getQR, false);
        },
        getQR: function (e) {
            var code = e.detail['sheetLabelNo']? e.detail['sheetLabelNo'] :e.detail['code'];
            var sheetNo = Core.Utils.getSheetNoFromScan(code);
            if (sheetNo == "") {
                return false;
            }
            var short;
            if (Core.Utils.isMySheet(sheetNo)) {
                short = Core.Utils.getShortSheetNo(sheetNo);
            } else {
                short = sheetNo;
            }
            $vue.fee.sheetNoShort = short;
            native.mediaVibrate(Core.ScanCode.ok, "");
        },
        initConfig: function () {
            var feeTypes = Core.Utils.getConfig("applyType");
            var options = "";
            $.each(feeTypes, function (i, v) {
                options += '<option value="' + v['value'] + '">' + v['label'] + '</option>';
            });
            console.log(options);
            $('#feeTypes').append(options);
        },
        apply: function () {
            var img1 = $("#img1").val();
            if (img1.length > 0) {
                $vue.fee.photo1 = img1;
            }
            var img2 = $("#img2").val();
            if (img2.length > 0) {
                $vue.fee.photo2 = img2;
            }
            var img3 = $("#img3").val();
            if (img3.length > 0) {
                $vue.fee.photo3 = img3;
            }
            Core.Service.post('api/auth/v1/ltl/sheetFeeChange/apply ', $vue.fee, function () {
                Oss.asyncUpload(img1,$("#img1").data('base'));
                Oss.asyncUpload(img2,$("#img2").data('base'));
                Oss.asyncUpload(img3,$("#img3").data('base'));
                // $vue.fee = {
                //     sheetNoShort: "",
                //     applyType: "",
                //     cod: "",
                //     pickPayFee: "",
                //     toPremium: "",
                //     toBackSheetFee: "",
                //     toReceiptFee: "",
                //     toDeliveryFee: "",
                //     photo1:"",
                //     photo2:"",
                //     photo3:""
                // };
                Core.App.alert("申请成功",function () {
                    Core.Page.back();
                });
                // native.showToast("申请成功");
            });
        },

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