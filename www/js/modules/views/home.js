/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var native = require("js/modules/hybridapi");
    var Core = require('js/modules/core/core');
    var $dbInnerManager = require('js/modules/manager/dbInnerManager');
    var analytics = require('js/modules/core/analytics');

    var lxDb = Core.lxDb;
    var page;
    var searchObj;
    var today, datePicker;
    var $vue;
    var IDB = false;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            var versionStr = '';
            if (env == 'release') {
                versionStr = version;
            } else {
                versionStr = version + " (" + env + ")";
            }
            $("#version").text(versionStr);
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
                    pwd: {
                        old: "",
                        new1: "",
                        new2: ""
                    }
                },
                watch: {},
                methods: {
                    changePwd: function (validate) {
                        if (App.validate(validate)) {
                            if ($vue.pwd.new1 !== $vue.pwd.new2) {
                                native.showToast("两次密码输入不一致");
                                return false;
                            }
                            Core.User.changePwd($vue.pwd.old, $vue.pwd.new1);
                        }
                    },
                    submitCz: function (validate) {
                        if (App.validate(validate)) {
                            App.applyTrade(2);
                        }
                    },
                    getConsumer: function () {
                        App.getConsumer();
                    },
                    showApplyList: function () {
                        Core.Page.changePage('applyList.html', true);
                    }
                }
            });


            this.initEvent();
            this.initPage();
            this.initHome();
            today = new Date().GetDay(1, 'none');
            datePicker = Core.Utils.initRangeDatePicker("#range-time");
            var timeText = today + " - " + today;
            $('#range-time').val(timeText);
            document.addEventListener('getScan', App.addScanFromNative, false);
            document.addEventListener('getQR', App.addScanFromNative, false);
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

            if (money * 1 < 0) {
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
                native.showToast(errors[errors.length - 1]['message']);
                return false;
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
                        detail: "充值运费",
                        money: Math.abs($vue.consumer['remain'])
                    };
                } else {
                    native.showToast("没有找到任何数据");
                }
            });
        },
        addScanFromNative: function (e) {
            var sheetLabelNo = Core.Utils.getSheetNoFromScan(e.detail['sheetLabelNo']) || Core.Utils.getSheetNoFromScan(e.detail['code']);
            if (sheetLabelNo == "") {
                return false;
            }
            native.mediaVibrate(Core.ScanCode.ok, "");
            var short;
            if (Core.Utils.isMySheet(sheetLabelNo)) {
                short = Core.Utils.getShortSheetNo(sheetLabelNo);
                Core.Cache.set('sheetNo', Core.Cache.get('sheetPre') + short);
                Core.Page.changePage('sheetDetail.html', true);
                return false;
            } else {
                $("#search-sheetNoConsign").val(sheetLabelNo);
                Core.App.showTab('#tab2');
            }
        },
        initPage: function () {
            $$(document).on('pageInit', '.page[data-page="findSheet"]', function (e) {
                App.findSheetList();
            });
            //     .on('pageAfterAnimation', '.page[data-page="erCode"]', function () {
            //     var lastUpdate = Core.Cache.get('lastUpdate') || {};
            //     $("#erCode").empty().qrcode({
            //         render: "canvas",
            //         width: 300,
            //         height: 300,
            //         text: lastUpdate['apkUrl']
            //     });
            // });
        },
        initEvent: function () {
            $('body')
                .on('click', '.scanQr', function () {
                    native.scanQr();
                })
                .on('click', '.shopToPerformanceReport', function () {
                    Core.Cache.set("reportParam", {
                        name: "到货汇总",
                        api: "shopToPerformanceReport"
                    });
                    Core.Page.changePage("orgReport.html", true);
                })
                .on('click', '.shopFromPerformanceReport', function () {
                    Core.Cache.set("reportParam", {
                        name: "发货汇总",
                        api: "shopFromPerformanceReport"
                    });
                    Core.Page.changePage("orgReport.html", true);
                })
                .on('click', '.lxManager', function () {
                    Core.Page.changePage("lxManager.html", true);
                })
                .on("click", '.feePickup', function () {
                    Core.Page.changePage("feePickupReport.html", true);
                })
                .on('click', '.decisionReport', function () {
                    Core.Page.changePage("decisionReport.html", true);
                })
                .on('click', '.deliveryTask', function () {
                    Core.Page.changePage("deliveryTaskList.html", true);
                })
                .on('click', '.feeApply', function () {
                    Core.Page.changePage("feeApply.html", true);
                })
                .on('click', '.codPayScan', function () {
                    analytics.onClickEvent(0x303000E)
                    Core.Page.changePage("codPayScan.html", true);
                })
                .on('click', '.customerRanking', function () {
                    Core.Page.changePage("customerRanking.html", true);
                })
                .on('click', '.goodsRanking', function () {
                    Core.Page.changePage("goodsRanking.html", true);
                })
                .on('click', '.ratioAnalysis', function () {
                    Core.Page.changePage("ratioAnalysis.html", true);
                })
                .on('click', '.account', function () {
                    Core.Page.changePage("account.html", true);
                })
                .on('click', '.pickupScan', function () {
                    Core.Page.changePage("pickupScanList.html", true);
                })
                .on('click', '.notice', function () {
                    Core.Page.changePage("message.html", true);
                })
                .on('click', '.agreementSheet', function () {
                    Core.Page.changePage("agreementSheet.html", true);
                })
                .on('click', '.pickupList', function () {
                    Core.Page.changePage("pickupList.html", true);
                })
                .on('click', '.exceptionReport', function () {
                    Core.Page.changePage("exceptionReport.html", true);
                })
                .on('click', '.orderList', function () {
                    Core.Page.changePage("orderList.html", true);
                })
                .on('click', '.tradeQuery', function () {
                    Core.Page.changePage("tradeQuery.html", true);
                })
                .on('click', '.createSheet', function () {
                    Core.Page.changePage("createSheet.html", true);
                })
                .on('click', '.fastCreate', function () {
                    Core.Page.changePage("offlineCreate.html", true);
                })
                .on('click', '.onlineCreate', function () {
                    Core.Page.changePage("fastCreate.html", true);
                })
                .on('click', '.myBill', function () {
                    Core.Page.changePage("myBill.html", true);
                })
                .on('click', '.goodsScan', function () {
                    Core.Page.changePage("scanList.html", true);
                })
                .on('click', '.hdqs', function () {
                    Core.Cache.set("backShiftType", Core.ScanType.hdqs);
                    Core.Page.changePage("backShift.html", true);
                })
                .on('click', '.hdlh', function () {
                    Core.Cache.set("backShiftType", Core.ScanType.hdlh);
                    Core.Page.changePage("backCollect.html", true);
                })
                .on('click', '.hdsh', function () {
                    Core.Cache.set("backShiftType", Core.ScanType.hdsh);
                    Core.Page.changePage("backShift.html", true);
                })
                .on('click', '.hdjkh', function () {
                    Core.Cache.set("backShiftType", Core.ScanType.hdjkh);
                    Core.Page.changePage("backShift.html", true);
                })
                .on('click', '.lineTransport', function () {
                    Core.Page.changePage("fyCarList.html", true);
                })
                .on('click', '.fyCarReport', function () {
                    Core.Page.changePage("fyCarReport.html", true);
                })
                .on('click', '.salesmanReport', function () {
                    Core.Page.changePage("salesmanReport.html", true);
                })
                .on('click', '.kkReport', function () {
                    Core.Page.changePage("kkReport.html", true);
                })
                .on('click', '.financeReport', function () {
                    Core.Page.changePage("financeReport.html", true);
                })
                .on('click', '.dhbc', function () {
                    Core.Page.changePage('dhCarList.html', true);
                })
                .on('click', '.printSetting', function () {
                    Core.Page.changePage('printSetting.html', true);
                })
                .on('click', '.sheetSetting', function () {
                    Core.Page.changePage('sheetSetting.html', true);
                })
                .on('click', '.inventory', function () {
                    Core.Page.changePage('inventory.html', true);
                })
                .on('click', '.pickup', function () {
                    Core.Page.changePage('pickUp.html', true);
                })
                .on('click', '.transfer', function () {
                    Core.Page.changePage('transfer.html', true);
                })
                .on('click', '.showError', function () {
                    Core.Page.changePage('error.html', true);
                })
                .on('click', '#logout', function () {
                    Core.App.confirm("确定退出登录", '温馨提示', function () {
                        Core.User.logout();
                    });
                })
                .on('click', '.tabbar  .tab-link', function () {
                    var text = $(this).data('title') == "首页" ? Core.Cache.get('companyName') : $(this).data('title');
                    $("#homeTitle").text(text);

                    if ($(this).data('title') == "首页") {
                        App.getConsumer();
                    }
                })
                .on('click', '.checkVersion', function () {
                    Core.Update.init(true);
                })
                .on('click', '.clearCache', function () {
                    Core.App.confirm("确认清除缓存,会清空所有本地数据", function () {
                        Core.Cache.remove('SheetTmpl');
                        Core.Cache.remove('Template');
                        $.each(localStorage, function (i) {
                            if (i.startsWith('Batch')) {
                                localStorage.removeItem(i);
                            }
                        });
                        $dbInnerManager.clearDb(function () {
                            Core.App.alert('清除成功', function () {
                                window.location.reload();
                            });
                        });
                    });
                })
                .on('change', '#chooseTime', function () {
                    var id = $(this).val();
                    if (id == 0) {
                        $('.chooseTime').show();
                        datePicker.open();
                    } else {
                        var timeText = new Date().GetDay(id, "none") + " - " + today;
                        $('#range-time').val(timeText);
                        $('.chooseTime').hide();
                    }
                })
                .on('click', '#search-yd', function () {
                    analytics.onClickEvent(0x3030010);
                    var rangeTimeArray = $('#range-time').val().split(' - ');
                    var start = rangeTimeArray[0] + " 00:00:00";
                    var end = rangeTimeArray[1] + " 23:59:59";

                    var isPrivate = $("#isPrivate:checked").length > 0 ? 1 : 0;
                    var sheetTmp = $("#search-sheetNoShort").val();
                    var sheetNoAbbr = "";
                    var sheetNo = "";
                    var sheetNoConsign = $("#search-sheetNoConsign").val();
                    if (sheetTmp.length <= 6) {
                        switch (sheetTmp.length) {
                            case 1:
                                sheetNoAbbr = "00000" + sheetTmp;
                                break;
                            case 2:
                                sheetNoAbbr = "0000" + sheetTmp;
                                break;
                            case 3:
                                sheetNoAbbr = "000" + sheetTmp;
                                break;
                            case 4:
                                sheetNoAbbr = "00" + sheetTmp;
                                break;
                            case 5:
                                sheetNoAbbr = "0" + sheetTmp;
                                break;
                            case 6:
                                sheetNoAbbr = sheetTmp;
                                break;
                        }
                    } else {
                        sheetNo = Core.Cache.get("sheetPre") + sheetTmp;
                    }

                    var searchObj = {
                        toCustomerPhone: $("#search-toCustomerPhone").val(),
                        fromCustomerPhone: $("#search-fromCustomerPhone").val(),
                        toCustomerName: $("#search-toCustomerName").val(),
                        fromCustomerName: $("#search-fromCustomerName").val(),
                        sheetNo: sheetNo,
                        sheetNoAbbr: sheetNoAbbr,
                        sheetNoConsign: sheetNoConsign,
                        privateFlag: isPrivate,
                        beginTime: start,
                        endTime: end
                    };
                    Core.Cache.set("searchObj", searchObj);
                    page = 1;
                    $(this).removeClass('active-state');
                    Core.Page.changePage("findSheet.html");
                })
                .on('refresh', '#findSheet .pull-to-refresh-content', function () {
                    App.findSheetList(true);
                })
                .on('click', '#findSheet .show-detail', function () {
                    var no = $(this).data('val');
                    Core.Cache.set('sheetNo', no);
                    Core.Page.changePage('sheetDetail.html', true);
                })
                .on('infinite', "#findSheet .infinite-scroll", function () {
                    if (Core.isLoading) return;
                    page++;
                    searchObj.pageNo = page;
                    Core.Service.get('api/auth/v1/ltl/sheet/querySheet', searchObj, function (results) {
                        var data = results['data'];
                        var sheets = {
                            sheets: data['rows']
                        };
                        var html = Core.Template.render('sheetTmpl', sheets);
                        $("#findSheet .search-content").append(html);
                        if (data['total'] - pageSize * page <= 0) {
                            Core.App.detachInfiniteScroll(".infinite-scroll");
                        }
                    });
                });
        },
        findSheetList: function (init) {
            if (init) {
                page = 1;
                Core.App.attachInfiniteScroll("#findSheet .infinite-scroll");
            }
            searchObj = Core.Cache.get("searchObj");
            searchObj.pageNo = page;
            searchObj.pageSize = pageSize;

            if (typeof searchObj.beginTime !== 'undefined'
                && typeof searchObj.endTime !== 'undefined') {
                var beginDateStr = searchObj.beginTime.split(' ')[0];
                var endDateStr = searchObj.endTime.split(' ')[0];

                var beginDate = new Date(Date.parse(beginDateStr));
                var endDate = new Date(Date.parse(endDateStr));

                if (beginDate > endDate)
                {
                    searchObj.beginTime = endDateStr + " 00:00:00";
                    searchObj.endTime = beginDateStr + " 23:59:59";
                }
            }

            Core.Service.get('api/auth/v1/ltl/sheet/querySheet', searchObj, function (results) {
                var data = results['data']['rows'];
                var sheets = {
                    sheets: data
                };
                var html = Core.Template.render('sheetTmpl', sheets);
                $("#findSheet .search-content").html(html);
                if (data.length > 0) {
                    $('.searchbar-not-found').hide();
                    $(".searchbar-found").removeClass('hide');
                    if (results['data']['total'] - pageSize <= 0) {
                        Core.App.detachInfiniteScroll(".infinite-scroll");
                    }
                } else {
                    $('.searchbar-not-found').show();
                }
            });
        },
        getLocalSheets:function(){
            if(IDB){
                IDB.sheet
                    .count()
                    .then(function (count) {
                        if(count >0){
                            $('#badge-fastCreate').text(count).show();
                        }else{
                            $('#badge-fastCreate').hide();
                        }

                    });
            }
        },
        /**
         * 初始化首页
         */
        initHome: function () {
            var attributes = Core.Cache.get('attributes') || {};
            if ("appMenuDoc" in attributes) {
                var name = attributes['name'];
                var companyName = Core.Cache.get('companyName');
                $("#companyName").text(companyName);
                $("#userName").text(name);

                IDB = lxDb.getIDB(Core.Cache.get('companyNo'));
                native.getConnectionInfo(function (type) {
                    if (type !== "none") {
                        lxDb.sync().start();
                        lxDb.grantSheetNoSegment();
                    }
                });
                App.getLocalSheets();
                document.removeEventListener('networkConnection', lxDb.networkConnection, false);
                document.addEventListener('networkConnection', lxDb.networkConnection, false);


                IDB.config.where("name").equals('ltl.sheet.create.template').first().then(function (obj) {
                    console.log(obj);
                    if (obj) {
                        Core.Cache.set("ltl.sheet.create.template", JSON.parse(obj['value']))
                    }
                });


                var html = Core.Template.render('homeTmpl', attributes['appMenuDoc']);
                $('#home-content').html(html);
                var html1 = Core.Template.render('reportTmpl', attributes['appMenuDoc']);
                $('#tab3').html(html1);
                $("#homeTitle").text(companyName);
                App.getConsumer();
            } else {
                native.showToast("请重新登录");
                Core.Page.changePage('login.html', true);
            }
        }
    };
    window.refresh = App.initHome;
    Core.init(App);
    module.exports = App;
});