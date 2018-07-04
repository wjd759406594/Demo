/**
 * Created by cc on 18/06/12.
 */
define(function (require, exports, module) {
    var native = require("js/modules/hybridapi");
    var Core = require('js/modules/core/core');
    var $vue;
    var hasShowDetail = false;
    var timestamp;
    var commitService = 0;
    var commitComission = 0;
    var commitMonth = 0;
    var thisYear;
    var thisMonth;
    var thisDay;
    var transaction_id;
    var avilableAmount;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    type: "",
                    currentMonth: "",
                    usedItem: "",
                    showUsedItem: false,
                    showPeriodItem: false,
                    repayList: [],
                    usedList: [],
                    bankInfor: {},
                    bankLogo: "",
                    bankName: "",
                    bankSnailNo: "",
                    checkedMonth: "",
                    showMonth: false,
                    perAmount: "",
                    showPerAmount: false,
                    showBankLogo: false,
                    showBankName: false,
                    showBankNo: false


                },
                watch: {},
                methods: {
                    hideUseItem: function () {
                        $("#used-dialog").css("visibility", "hidden");
                        $("#used-dialog").css("display", "none");
                    },
                    getUsedList: function () {
                        App.getUsedList()

                    },
                    setUseItem: function (chooseShip) {
                        $vue.usedItem = chooseShip;
                        $vue.showUsedItem = true;
                        this.hideUseItem();


                    },
                    getBanInfor: function () {
                        Core.App.alert('目前只支持中国银行、农业银行、工商银行和建设银行还款', '', function () {
                            native.callBankList(function (result) {
                                var carNo = result['cardNo'];
                                if (typeof carNo != 'undefined' && carNo.length > 0) {
                                    $vue.bankInfor = result;
                                    $vue.bankLogo = result['cardIcon'] || "";
                                    var bankNo = result['cardNo'] || "    ";
                                    $vue.bankSnailNo = bankNo.substr(bankNo.length - 4, 4);
                                    $vue.bankName = result['cardName'] || "";
                                    $vue.showBankLogo = true;
                                    $vue.showBankName = true;
                                    $vue.showBankNo = true;
                                } else {
                                    $vue.bankInfor.cardNo = '';
                                    $vue.bankLogo = "";
                                    $vue.bankSnailNo = '';
                                    $vue.bankName = '';
                                    $vue.showBankLogo = false;
                                    $vue.showBankName = false;
                                    $vue.showBankNo = false;
                                }
                            })

                        });
                    },
                    showPeriodDetail: function (item) {
                        $vue.currentMonth = item.month;
                        if ($('#' + item.month).css('display') == 'none') {
                            $('#' + item.month).css('display', '');
                        } else {
                            $('#' + item.month).css('display', 'none');
                        }

                    },
                    showPeriod: function () {

                        if ($("#mount").val() == "") {
                            native.showToast("请输入借款数目");
                            return;
                        }
                        if (avilableAmount >= 1000 && parseInt($("#mount").val()) < 1000) {
                            native.showToast("最低金额不能小于1000");
                            return;
                        }

                        if (avilableAmount < 1000 && parseInt($("#mount").val()) < avilableAmount) {
                            native.showToast("额度小于1000请全部一次提取");
                            return;
                        }
                        if (parseInt($("#mount").val()) > avilableAmount) {
                            native.showToast("金额超出最高可借金额");
                            return;
                        }

                        Core.Page.changePageName("mount-time");
                        App.getRepayTimeList();

                    },
                    calculateCommissionAmount: function (item) {
                        return Core.Utils.mul(item.commission, 100);
                    },
                    calculateTotalAmount: function (item) {
                        var amount = $("#mount").val();
                        var service = Core.Utils.mul(amount, item.service);
                        var commission = Core.Utils.mul(Core.Utils.mul(amount, item.commission), item.month);
                        return Core.Utils.formatMoney(Core.Utils.add(amount, Core.Utils.add(service, commission)), 2);
                    },
                    showDetail: function (item) {
                        if (item == $vue.currentMonth) {
                            if (!hasShowDetail) {
                                hasShowDetail = true;
                                return true;
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }


                    },
                    commitToSign: function () {
                        App.getDriverLoanBankCardState();
                    },
                    getReapayData: function (i) {
                        var repayDate = App.getRepayDate(i);
                        return repayDate;

                    },
                    getCurrentReapayData: function () {

                        var date = new Date(timestamp);
                        var Y = date.getFullYear();
                        var M = date.getMonth() + 1;
                        var D = date.getDate();


                        return Y + "-" + M + "-" + D;

                    },
                    calculatePerAmount: function (i, item) {
                        return App.calculatePerAmount(i, item);


                    },

                    loanAmount: function () {
                        return $("#mount").val();


                    },

                    chooseMonth: function () {

                        var canBack = false;

                        var inputs = document.getElementsByTagName("input");
                        var checkboxArray = [];
                        for (var i = 0; i < inputs.length; i++) {
                            var obj = inputs[i];
                            if (obj.type == 'radio') {
                                checkboxArray.push(obj);
                            }
                        }
                        for (var i = 0; i < checkboxArray.length; i++) {
                            if (checkboxArray[i].checked == true) {
                                $vue.checkedMonth = checkboxArray[i].getAttribute("data");
                                canBack = true;
                            }
                        }

                        for (var i = 0; i < $vue.repayList.length; i++) {
                            if ($vue.checkedMonth == $vue.repayList[i].month) {
                                $vue.perAmount = App.calculatePerAmount(100, $vue.repayList[i])
                                commitComission = $vue.repayList[i].commission;
                                commitMonth = $vue.repayList[i].month;
                                commitService = $vue.repayList[i].service;

                                var date = new Date(timestamp);
                                thisYear = date.getFullYear();
                                thisMonth = date.getMonth() + 1;
                                thisDay = date.getDate();
                                commitMonth = $vue.checkedMonth;

                                break;
                            }

                        }

                        if (canBack) {
                            $vue.showMonth = true;
                            $vue.showPerAmount = true;
                            Core.Page.back();

                        } else {
                            native.showToast("请选择借款期限")
                        }


                    }
                }

            });
            avilableAmount = Core.Cache.get("avilableAmount");
            console.log("avilableAmount:" + avilableAmount);
            $("#mount").attr('placeholder', '最高可借' + avilableAmount + '元');
            $("#mount").attr('max', avilableAmount);
            $('#mount').bind('input propertychange', function () {
                var borrowValue = $(this).val();
                if (borrowValue > parseInt(avilableAmount)) {
                    var mAmountStr = $("#mount").val() + "";
                    mAmountStr = mAmountStr.substr(0, mAmountStr.length - 1);
                    $("#mount").val(parseInt(mAmountStr));
                }

                if (parseInt($("#mount").val()) > 0 && commitMonth > 0) {
                    console.log("自动计算月供金额");
                    var perAmount;
                    perAmount = Core.Utils.div($("#mount").val(), commitMonth);
                    perAmount = parseInt(Core.Utils.mul(perAmount, 100));
                    perAmount = Core.Utils.div(perAmount, 100);
                    var perService;
                    perService = Core.Utils.mul($("#mount").val(), commitService);
                    perService = perService + Core.Utils.mul(Core.Utils.mul($("#mount").val(), commitComission), commitMonth);
                    perService = Core.Utils.div(perService, commitMonth);
                    perService = parseInt(Core.Utils.mul(perService, 100));
                    perService = Core.Utils.div(perService, 100);
                    $vue.perAmount = Core.Utils.add(perAmount, perService);
                } else {
                    $vue.perAmount = 0;
                }


            });
            App.gainBankInfor();


        },
        getRepayTimeList: function () {
            Core.Service.get('app/driverLoan/getRepayRate', {}, function (results) {
                timestamp = results['content']['timestamp'];
                $vue.repayList = results['content']['dataList'] ['repayRateList'] || [];


            });
        },
        getUsedList: function () {
            if ($vue.usedList.length > 0) {
                App.showUse();
            } else {
                Core.Service.get('app/driverLoan/getAllLoanDesc', {}, function (results) {
                    $vue.usedList = results['content']['dataList'] || [];
                    App.showUse();
                });
            }

        },
        showUse: function () {
            $("#used-dialog").css("visibility", "visible");
            $("#used-dialog").css("display", "inline");
        },
        commitToSign: function () {
            var singObject = {
                uppAmt: Core.Utils.intToChinese($("#mount").val()),
                lowAmt: $("#mount").val(),
                loanTerm: "M",
                financingPeriod: commitMonth + "",
                financingYear: thisYear + "",
                financingMonth: thisMonth + "",
                financingDay: thisDay + "",
                accountName: $vue.bankInfor.name,
                accountNo: $vue.bankInfor.cardNo,
                accountBank: $vue.bankInfor.cardName,
                applyName: $vue.bankInfor.name,
                year: thisYear + "",
                month: thisMonth + "",
                day: thisDay + "",
                serviceChargeRate: commitService + "",
                factoringRate: commitComission,

            };

            var FinalObject = {
                parameter_map: singObject
            }

            var dict = {
                url: serverAddress + '/app/electricSign/driverLoadSignAgreement',
                type: "post",
                data: FinalObject,
                isEncrypt: '0'
            };

            native.netWorkRequest(dict, function (result) {
                console.log(result);
                transaction_id = result['transaction_id'] || "";
                native.callFadada(result['sign_url'], function () {
                    App.borrowCommit();

                });
                console.log("调用法大大，singurl：" + result['sign_url']);


            });


        },
        gainBankInfor: function () {
            Core.Service.get('app/payment/v1/cardInfo', {}, function (results) {

                $vue.bankInfor = results['content']['newCard'] || [];
                $vue.bankLogo = results['content']['newCard']['cardIcon'] || "";
                var bankNo = results['content']['newCard']['cardNo'] || ""
                $vue.bankSnailNo = bankNo.substr(bankNo.length - 4, 4)
                $vue.bankName = results['content']['newCard']['cardName'] || "";

                if ($vue.bankLogo.length > 0) {
                    $vue.showBankLogo = true;
                }
                if ($vue.bankName.length > 0) {
                    $vue.showBankName = true;
                }
                if ($vue.bankSnailNo.length > 0) {
                    $vue.showBankNo = true;
                }
            });


        },
        getRepayDate: function (i) {

            var date = new Date(timestamp);
            var Y = date.getFullYear();
            var M = date.getMonth() + 1;
            var D = date.getDate();


            var mFinalYear;
            var mFinalMonth;
            var mFinalDay;
            mFinalYear = Y;
            mFinalMonth = M + i;
            mFinalDay = D;


            if (mFinalMonth > 12) {
                mFinalMonth = mFinalMonth - 12;
                mFinalYear = mFinalYear + 1;
            }

            if (mFinalDay > Core.Utils.getDayOfMonth(mFinalYear, mFinalMonth)) {
                mFinalDay = Core.Utils.getDayOfMonth(mFinalYear, mFinalMonth);
            }
            return mFinalYear + "-" + mFinalMonth + "-" + mFinalDay;


        },
        calculatePerAmount: function (i, item) {
            var perAmount;
            perAmount = Core.Utils.div($("#mount").val(), item.month);
            perAmount = parseInt(Core.Utils.mul(perAmount, 100));
            perAmount = Core.Utils.div(perAmount, 100);
            var perService;
            perService = Core.Utils.mul($("#mount").val(), item.service);
            perService = perService + Core.Utils.mul(Core.Utils.mul($("#mount").val(), item.commission), item.month);
            perService = Core.Utils.div(perService, item.month);
            perService = parseInt(Core.Utils.mul(perService, 100));
            perService = Core.Utils.div(perService, 100);
            perAmount = Core.Utils.add(perAmount, perService);
            if (i == item.month) {
                var amount = $("#mount").val();
                var service = Core.Utils.mul(amount, item.service);
                var commission = Core.Utils.mul(Core.Utils.mul(amount, item.commission), item.month);
                var total = Core.Utils.add(amount, Core.Utils.add(service, commission))
                var otherMothAmount = Core.Utils.mul(perAmount, (item.month - 1));
                perAmount = Core.Utils.sub(total, otherMothAmount);
            }
            return Core.Utils.formatMoney(perAmount, 2);
        },
        getDriverLoanBankCardState: function () {
            if ($("#mount").val() == "") {
                native.showToast("请输入借款数目");
                return;
            }
            if (avilableAmount >= 1000 && parseInt($("#mount").val()) < 1000) {
                native.showToast("最低金额不能小于1000");
                return;
            }

            if (avilableAmount < 1000 && parseInt($("#mount").val()) < avilableAmount) {
                native.showToast("额度小于1000请全部一次提取");
                return;
            }
            if (parseInt($("#mount").val()) > avilableAmount) {
                native.showToast("金额超出最高可借金额");
                return;
            }
            if (commitMonth < 1) {
                native.showToast("请选择借款期限");
                return;
            }
            if ($vue.usedItem.length < 1) {
                native.showToast("请选择借款用途");
                return;
            }

            if ($vue.showBankNo == false || $vue.bankInfor.cardNo.length < 1) {
                native.showToast("请选择还款账户");
                return;
            }
            if (!$("#protocol").is(":checked")) {
                native.showToast("请先同意融资协议");
                return;
            }

            Core.Service.get('app/driverLoan/validateRepayAcct', {
                bankNo: $vue.bankInfor.bankNo
            }, function (results) {
                App.commitToSign();

            }, function (error) {
                if (typeof error !== 'undefined'
                    && typeof error['msg'] !== 'undefined') {
                    console.log(error['msg']);
                    native.showToast(error['msg']);
                } else {
                    native.showToast('网络不给力，请稍后重试！');
                }
            });
        },
        borrowCommit: function () {
            var commitObject = {
                transaction_id: transaction_id,
                loanAmt: $("#mount").val(),
                loanDesc: $vue.usedItem,
                loanDays: commitMonth,
                loanDaysUnit: "M",
                acctName: $vue.bankInfor.name,
                bankName: $vue.bankInfor.cardName,
                OpeningBank: $vue.bankInfor.cardName,
                cardNo: $vue.bankInfor.cardNo,
                bankCode: $vue.bankInfor.bankNo,
                BoundingBankMobile: $vue.bankInfor.mobile
            };

            var dict = {
                url: serverAddress + '/app/electricSign/driverLoadConfirmDrawings',
                type: "post",
                data: commitObject,
                isEncrypt: '0'
            };
            native.netWorkRequest(dict, function (result) {
                console.log(result);
                Core.Page.changePage('driverLoanBorrowResult.html', true);
            });
        }
    }


    window.App = App;
    // window.refresh = App.findApplyList;
    Core.init(App);
    module.exports = App;
});