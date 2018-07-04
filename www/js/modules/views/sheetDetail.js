/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var $sheet = require('js/modules/manager/offlineSheetConfig');
    var $sheetMoreDetail = require("js/modules/views/sheetMoreDetail");
    var sheetNo;
    var sheetView;
    var attributes = Core.Cache.get('attributes');

    var codStateDesc = {
        1: "未收未付",
        2: "已收未汇",
        3: "已收已汇",
        4: "已收未付",
        5: "已收已付"
    };


    Template7.registerHelper('cod', function (sheet) {
        var text;
        text = "";


        if (sheet['cod'] > 0) {
            text += "货款" + sheet['cod'] + " 手续费" + sheet['codFee'] + '(' + (sheet['codFeeMode'] == 1 ? "寄付" : "到付") + ') ' + codStateDesc[sheet['codState']];
        }

        if (sheet['fromCustomerAccount']) {
            text += "银行卡号 " + sheet['fromCustomerAccount'] + "<br> 银行名称 " + sheet['fromCustomerBank'] + "<br> 持卡人" + sheet['fromCustomerHolder'];
        }
        return text == "" ? "-" : text;
    });

    Template7.registerHelper('fj', function (sheet) {
        return "声明价值" + sheet['declaredValue'] + " 手续费" + sheet['codFee']
            + " 垫付" + sheet['payOutFee'] + " 劳务费" + sheet['rebates'];
    });

    Template7.registerHelper('waybillBh', function (sheet) {
        var tmp = "";

        if (sheet['backSheetAmount'] > 0) {
            tmp += "<a href=\"#\" class=\"item-link list-button btn print\" data-mod=\"WaybillBh\" data-tmp=\"3\">补打回单</a>";
        }

        return tmp;
    });

    Template7.registerHelper('fromFee', function (sheet) {
        var tmpArr = {
            "nowPayFee": "现付",
            "fromCustomerMonthFee": "发货月结",
            "codPayFee": "货款扣",
            "backPayFee": "回单付",
            "fromDeliveryFee": "送货费",
            "fromReceiptFee": "接货费",
            "fromPremium": "保费",
            "fromBackSheetFee": "回单费",
            "fromDocumentFee": "工本费",
            "fromOtherFee": "服务费"
        };

        var tmp = "";
        $.each(tmpArr, function (k, v) {
            if (sheet[k] > 0) {
                tmp += v + sheet[k] + " ";
            }
        });
        return tmp == "" ? "-" : tmp;
    });

    Template7.registerHelper('toFee', function (sheet) {
        var tmpArr = {
            "pickPayFee": "提付",
            "toCustomerMonthFee": "收货月结",
            "toDeliveryFee": "送货费",
            "toReceiptFee": "接货费",
            "toPremium": "保费",
            "toCodFee": "货款手续费",
            "toBackSheetFee": "回单费",
            "toDocumentFee": "工本费",
            "toOtherFee": "服务费"
        };
        var tmp = "";
        $.each(tmpArr, function (k, v) {
            if (sheet[k] > 0) {
                tmp += v + sheet[k] + " ";
            }
        });
        return tmp == "" ? "-" : tmp;
    });

    Template7.registerHelper('sheetPickup', function (sheetPickup) {
        var text = '<div class="sheetTitle mt10"><i class="icon icon-th"></i>提货记录</div>';
        if (sheetPickup['pickupState'] == 1) {
            text += '<div class="sheetTimeline content">' +
                '提货客户' + sheetPickup['pickupCustomerName'] + '(' + sheetPickup['pickupCustomerPhone'] + ')于' + sheetPickup['pickupDate'] +
                '提货,由' + sheetPickup['pickupUserName'] + "(" + sheetPickup['pickupOrgName'] + ")办理"
                + '</div>';
        } else {
            text += '<div class="sheetTimeline no-result"></div>';
        }
        return text;
    });

    Template7.registerHelper('backSheetInfo', function (sheet) {
        if (sheet['backSheetAmount'] > 0) {
            return sheet['backSheetAmount'] + "张 " + sheet['backSheetRequirement'];
        } else {
            return "无回单";
        }
    });

    Template7.registerHelper('otherFee', function (sheet) {
        var tmpArr = {
            "payOutFee": "垫付",
            "rebates": "劳务费"
        };
        var tmp = "";
        var msg = "";
        $.each(tmpArr, function (k, v) {
            if (sheet[k] > 0) {
                if (k === "payOutFee") {
                    msg += sheet['payOutFeeSettleMode'] == 1 ? "<span class='color-blue'>[现返]</span>" : "<span class='color-red'>[未返]</span>";
                }
                tmp += v + sheet[k] + msg + " ";
            }
        });
        return tmp == "" ? "-" : tmp;
    });


    var App = {
        init: function () {
            console.log("运单简介初始化成功");
            this.initPageEvent();
            this.initEvents();
            this.getSheet();
        },
        initPageEvent: function () {
            $$(document).on('pageInit', '.page[data-page="sheetMoreDetail"]', function (e) {
                console.log("sheetMoreDetail");
                $sheetMoreDetail.getSheet();
            });
        },
        getSheet: function () {
            $("#sheetDetail #detail").empty();
            $('.editSheet').hide();
            sheetNo = Core.Cache.get('sheetNo');
            if (!sheetNo) {
                native.showToast("运单号不存在!");
                Core.Page.back();
                return false;
            }
            Core.Service.get('api/auth/v1/ltl/sheet/getBySheetNo', {
                sheetNo: sheetNo
            }, function (result) {
                $('.editSheet').show();
                sheetView = result['data'];
                if (sheetView) {
                    $.each(sheetView, function (k, v) {
                        if (v == null || v == "null") {
                            sheetView[k] = "";
                        }
                    });
                    sheetView['printCount'] = 1;
                    var tmp = {
                        sheetView: result['data']
                    };
                    Core.Cache.set('lastSaveSheet', sheetView);
                    var html = Core.Template.render('sheetDetailTmpl', tmp);
                    $("#sheetDetail #detail").html(html);
                } else {
                    native.showToast("查不到该运单");
                    Core.Page.back();
                }
            });
        },
        initEvents: function () {
            $('body').on('refresh', '#sheetDetail .pull-to-refresh-content', function () {
                App.getSheet();
            }).on('click', '.editSheet', function () {
                Core.Page.changePage('editSheet.html', true);
            }).on('click', '.print', function () {
                var mod = $(this).data('mod');//打印机类型
                var template = $(this).data('tmp'); //标签模板
                $sheet.print(mod, template);
                return false;
            }).on('refresh', '#sheetMoreDetail .pull-to-refresh-content', function () {
                $sheetMoreDetail.getSheet();
            }).on('focus', '#my-form input', function () {
                $(this).val('');
            }).on('click', '.returnSheet', function () {
                Core.Service.get('api/auth/v1/ltl/sheet/getReturnSheet', {
                    sheetNo: sheetNo
                }, function (result) {
                    var sheet = result['data'];
                    sheet.isReturn = 1;
                    Core.Cache.set('lastReturnSheet', sheet);
                    Core.Page.changePage('editSheet.html?isReturn=1', true);
                });
            // }).on('click', '.share', function () {
            //     var type = $(this).data('type');
            //     var message = "【" + Core.Cache.get("companyName") + "】";
            //     var URL = "http://t.my56cloud.com/?s=" + sheetView['sheetNo'];
            //     var phone = "";
            //     if (type == "from") {
            //         phone = sheetView['fromCustomerPhone'];
            //         message += "尊敬的" + sheetView['fromCustomerName'];
            //     } else {
            //         phone = sheetView['toCustomerPhone'];
            //         message += "尊敬的" + sheetView['toCustomerName'];
            //     }
            //     message += "您好,请点击" + URL + " 查看单号" + sheetView['sheetNoShort'] + "于" + sheetView['createDate'].substr(0,10) + "发往" + sheetView['toShopName'] + "的" + sheetView['goodsAmount'] + "件" + sheetView['goodsName'] + "的详细信息";
            //     native.sendSMS(phone, message);
            // }).on('click', '.shareMore', function () {
            //     var message = "【" + Core.Cache.get("companyName") + "】";
            //     var URL = "http://t.my56cloud.com/?s=" + sheetView['sheetNo'];
            //     message += "您好,请点击" + URL + " 查看单号" + sheetView['sheetNoShort'] + "于" + sheetView['createDate'].substr(0,10) + "发往" + sheetView['toShopName'] + "的" + sheetView['goodsAmount'] + "件" + sheetView['goodsName'] + "的详细信息";
            //     native.share(message);
            });
        },
        reload: function () {
            if (Core.Cache.get("needRefresh")) {
                Core.Cache.remove("needRefresh");
                App.getSheet();
            }

        },
        refresh: function () {
            App.getSheet();
        }
    };
    window.refresh = App.refresh;
    Core.init(App);
    module.exports = App;
});