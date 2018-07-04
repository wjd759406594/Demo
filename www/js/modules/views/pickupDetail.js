/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var Oss = require('js/modules/manager/oss');
    var laytpl = require('js/modules/core/laytpl');
    var $vue;
    var App = {
        init: function () {
            Oss.init();
            console.log("页面js初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    sheet: null,
                    isConsignNo: false,
                    sheetShortNo: "",
                    pickupAmount: 1,//提货件数
                    customerIdNo: "",
                    photoFileId: "",
                    pickPayFeeDecrease: "",
                    chooseList: [],
                    deliveryActualFee: "",
                    chooseDs: true,  //代收
                    chooseTf: true, //提付
                    chooseHd: false  //回单
                },
                methods: {
                    pickupFee: function () {
                        App.pickupFee();
                    },
                    print:function () {
                        var print = Core.Utils.getPrintSetting('WaybillBq');
                        if (print) {
                            var deviceType = Core.Utils.getDeviceType(print);
                            var configName = Core.Utils.getPrintTemplateName(2);
                            var WaybillCount = Core.Cache.get('WaybillCount');
                            Core.Utils.getPrintTemplate(configName, deviceType, function (result) {
                                var tpl = result['content'];
                                var html = laytpl(tpl).render($vue.sheet);
                                console.log(html);

                                native.print(print['address'], deviceType, 1, WaybillCount, html);
                            });
                        }
                    }
                }
            });
            this.initEvent();
            App.refresh();
        },
        refresh: function () {
            $(".input-file").removeAttr('style');
            $("#img1").val("");
            $("#img2").val("");
            $("#img3").val("");
            $vue.sheet = null;
            var sheet = Core.Cache.get('lastPickupSheet');
            if (!sheet) {
                native.showToast("获取不到运单信息");
                Core.Page.back();
                return false;
            }
            $vue.sheetShortNo = sheet['sheetShortNo'];
            $vue.sheet = sheet;
            $vue.pickupAmount = sheet['goodsAmount'];//提货件数
            $vue.photoFileId = "";
            $vue.chooseDs = true;  //代收
            $vue.chooseTf = true;  //代收
            $vue.chooseHd = false;  //代收
            if ($vue.sheet.backSheetAmount > 0) {
                $vue.chooseHd = true;
            }
        },
        pickupFee: function () {
            if ($vue.pickupAmount < 1) {
                native.showToast('提货件数应大于0');
                return false;
            }

            if ($vue.sheet.toCustomerName.length < 1) {
                native.showToast('请输入客户姓名');
                return false;
            }

            if ($vue.sheet.toCustomerPhone < 1) {
                native.showToast('请输入客户电话');
                return false;
            }
            var photo1, photo2, photo3;
            var img1 = $("#img1").val();
            if (img1.length > 0) {
                photo1 = img1;
            }
            var img2 = $("#img2").val();
            if (img2.length > 0) {
                photo2 = img2;
            }
            var img3 = $("#img3").val();
            if (img3.length > 0) {
                photo3 = img3;
            }

            var signBackSheet = $vue.chooseHd == true ? 1 : 0;
            var pickPayFeeCreditState = $vue.chooseTf == true ? 0 : 1;
            var codCreditState = $vue.chooseDs == true ? 0 : 1;

            var tmp = {
                id: $vue.sheet.id,
                pickupAmount: $vue.pickupAmount,
                pickupCustomerName: $vue.sheet.toCustomerName,
                pickupCustomerPhone: $vue.sheet.toCustomerPhone,
                pickupCustomerIdNo: $vue.customerIdNo,
                deliveryActualFee: $vue.deliveryActualFee,       //实际送货费
                feeResponsibleId: "",      //费用责任人
                pickPayFeeDecrease: "",      //减免
                pickPayFeeIncrease: "",
                pickupPhotoFileId: "",
                signBackSheet: signBackSheet, //回单 选中1
                pickPayFeeCreditState: pickPayFeeCreditState,  //提付信用状态 勾上是0
                codCreditState: codCreditState,       //代收货款 勾上是0
                photo1: photo1,
                photo2: photo2,
                photo3: photo3
            };

            var message = "实收货款" + (codCreditState == 0 ? $vue.sheet.cod : 0) + "元 提付总运费" + (pickPayFeeCreditState == 0 ? $vue.sheet.pickTotalFee : 0) + "元";
            if ($vue.sheet.backSheetAmount > 0) {
                message += '<br>该运单有回单,请注意签收';
            }

            Core.App.confirm(message, "确认提货", function () {
                App.remotePickupFee(tmp);
            });
        },
        remotePickupFee: function (text) {
            Core.Service.post('api/auth/v1/ltl/pickup/pickupFeeNew', text, function () {

                Oss.asyncUpload($("#img1").val(),$("#img1").data('base'));
                Oss.asyncUpload($("#img2").val(),$("#img2").data('base'));
                Oss.asyncUpload($("#img3").val(),$("#img3").data('base'));

                native.showToast("提货成功");
                $vue.sheet = null;
                $vue.sheetNo = "";
                $vue.sheetShortNo = "";
                $vue.isConsignNo = false;
                $vue.chooseDs = true;  //代收
                $vue.chooseTf = true;  //代收
                $vue.chooseHd = false;  //代收
                $(".input-file").removeAttr('style');
                $("#img1").val("");
                $("#img2").val("");
                $("#img3").val("");
                Core.Page.back();
            });
        },
        initEvent: function () {}
    };
    Core.init(App);
    module.exports = App;
});