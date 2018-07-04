/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var Oss = require('js/modules/manager/oss');
    var $vue;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            Oss.init();
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    sheetNo: "",
                    sheetShortNo: "",
                    isConsignNo: false,
                    reportType: "货物破损",
                    reportContent: "",
                    photo1:"",
                    photo2:"",
                    photo3:""
                },
                watch: {},
                methods: {
                    scan: function () {
                        native.scanQr();
                    },
                    pickupFee: function () {
                        App.pickupFee();
                    }
                }
            });
            this.initSheet();
            document.addEventListener('getScan', App.addScanFromNative, false);
            document.addEventListener('getQR', App.getQR, false);
        },
        getQR: function (e) {
            var sheetNo = Core.Utils.getSheetNoFromScan(e.detail['code']);
            if (sheetNo == "") {
                return false;
            }
            native.mediaVibrate(Core.ScanCode.ok, "");
            if(Core.Utils.isMySheet(sheetNo)){
                $vue.sheetShortNo = Core.Utils.getShortSheetNo(sheetNo);
                $vue.isConsignNo = false;
            }else{
                $vue.sheetShortNo = sheetNo;
                $vue.isConsignNo = true;
            }
        },
        initSheet: function () {
            $vue.$data = {
                sheetNo: "",
                sheetShortNo: "",
                isConsignNo: false,
                reportType: "货物破损",
                reportContent: "",
                photo1:"",
                photo2:"",
                photo3:""
            };
            var sheet = Core.Cache.get("exceptionSheet");
            if (sheet) {
                if (sheet['sheetNoConsign'] != "") {
                    $vue.sheetShortNo = sheet['sheetNoConsign'];
                    $vue.isConsignNo = true;
                } else {
                    $vue.sheetShortNo = sheet['sheetNoShort'];
                    $vue.isConsignNo = false;
                }
                Core.Cache.remove('exceptionSheet');
            } else {
                $vue.sheetShortNo = "";
                $vue.isConsignNo = false;
            }
            $(".input-file").removeAttr('style');
            $("#img1").val("");
            $("#img2").val("");
            $("#img3").val("");
        },
        pickupFee: function () {
            if (!$vue.sheetShortNo) {
                native.showToast('请输入运单号');
                return false;
            }
            console.log($vue.sheetNo);
            var img1 = $("#img1").val();
            if (img1.length > 0) {
               $vue.photo1 = img1;
            }
            var img2 = $("#img2").val();
            if (img2.length > 0) {
                $vue.photo2 = img2;
            }
            var img3 = $("#img3").val();
            if (img3.length > 0) {
                $vue.photo3 = img3;
            }
            $vue.sheetNo = $vue.isConsignNo == 1 ? $vue.sheetShortNo : Core.Cache.get('sheetPre') + $vue.sheetShortNo;
            Core.Service.post('api/auth/v1/ltl/exceptionExport/sheetExceptionNew', $vue.$data, function () {
                debugger;
                Oss.asyncUpload($("#img1").val(),$("#img1").data('base'));
                Oss.asyncUpload($("#img2").val(),$("#img2").data('base'));
                Oss.asyncUpload($("#img3").val(),$("#img3").data('base'));
                //此处用alert显示
                Core.App.alert("上报成功",function () {
                    Core.Page.back();
                });
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
            $vue.sheetShortNo = Core.Utils.barcodeRuleFilter(sheetLabelNo);
            native.mediaVibrate(Core.ScanCode.ok, "");
        }
    };
    Core.init(App);
    module.exports = App;
});