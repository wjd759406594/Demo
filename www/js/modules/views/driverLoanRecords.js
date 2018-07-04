/**
 * Created by chengcai on 18/05/14.
 */
define(function (require, exports, module) {

    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var App;
    var vue;
    var mBorrowpage = 1;
    var mRepaypage = 1;
    var mHaveLoadReapy = false;


    App = {
        init: function () {
            vue = new Vue({
                el: '#vueBound',
                data: {
                    type: "",
                    shallRepayAmount: "",
                    shallRepayDate: "",
                    shallRepayTips: "已出账单应还金额（元）",
                    applyRecords: [],
                    show: true,
                    showBorrow: true,
                    showRepay: false
                },
                methods: {
                    showDetail: function (item) {
                        console.log('showDetail ' + item['currStagesShallRepay']);
                        if (vue.type == '1') {
                            Core.Cache.set('repaidId', item['repaidId']);
                            Core.Page.changePage('driverLoanRepaymentDetail.html', true);
                        } else {
                            Core.Cache.set('demandId', item['demandId']);
                            Core.Page.changePage('driverLoanBorrowDetail.html', true);
                        }
                    },
                    getListDriverLoan: function (type) {
                        vue.type = type;
                        if (type == "1") {
                            vue.showRepay = true;
                            vue.showBorrow = false;
                            if (!mHaveLoadReapy) {
                                mHaveLoadReapy = true;
                                App.findSheetList()
                            }
                        } else {
                            vue.showRepay = false;
                            vue.showBorrow = true;
                        }
                    },
                }
            });
            this.initEvent()
            this.getShallRepay();
            this.findSheetList()
        },
        initEvent: function () {
            $('body')
                .on('refresh', '#findSheet .pull-to-refresh-content', function () {
                    App.findSheetList(true);
                })
                .on('refresh', '#findSheet .pull-to-refresh-content-repay', function () {
                    App.findSheetList(true);
                })
                .on('infinite', "#findSheet .infinite-scroll1-repay", function () {
                    if (Core.isLoading) return;
                    mRepaypage++;
                    Core.Service.get('app/driverLoan/listDriverLoanRepay', {
                        "currentPage": mRepaypage,   //当前页 int
                        "rows": 20          //每页行数 int
                    }, function (result) {
                        var datalist = result['content']['dataList'];
                        var finalDiv = document.createElement("div");
                        for (var i = 0; i < datalist.length; i++) {
                            var returnDive = App.createHtml(datalist[i]);
                            finalDiv.appendChild(returnDive);
                        }
                        $("#findSheet .search-content").append(finalDiv);
                        if (datalist.length < 20) {
                            Core.App.detachInfiniteScroll(".infinite-scroll");
                        }
                    });
                })
                .on('infinite', "#findSheet .infinite-scroll", function () {
                    if (Core.isLoading) return;
                    mBorrowpage++;
                    Core.Service.get('app/driverLoan/listDriverLoan', {
                        "currentPage": mBorrowpage,   //当前页 int
                        "rows": 20          //每页行数 int
                    }, function (result) {
                        var datalist = result['content']['dataList'];
                        var finalDiv = document.createElement("div");
                        for (var i = 0; i < datalist.length; i++) {
                            var returnDive = App.createHtml(datalist[i]);
                            finalDiv.appendChild(returnDive);
                        }
                        $("#findSheet .search-content").append(finalDiv);
                        if (datalist.length < 20) {
                            Core.App.detachInfiniteScroll(".infinite-scroll");
                        }
                    });
                });

        },
        findSheetList: function (init) {
            if (vue.type == "1") {
                if (init) {
                    mRepaypage = 1;
                    Core.App.attachInfiniteScroll("#findSheet .infinite-scroll");
                }
                console.log("请求接口获取还款记录");
                Core.Service.get('app/driverLoan/listDriverLoanRepay', {
                    "currentPage": mRepaypage,   //当前页 int
                    "rows": 20          //每页行数 int
                }, function (result) {
                    console.log(result);
                    var datalist1 = result['content']['dataList'];
                    if (datalist1 == null) {
                        mHaveLoadReapy = false;
                        return
                    }
                    var finalDiv = document.createElement("div");
                    for (var i = 0; i < datalist1.length; i++) {
                        var returnDive = App.createHtml(datalist1[i], vue.type);
                        finalDiv.appendChild(returnDive);
                    }
                    $("#findSheet .search-content-repay").html(finalDiv);
                    if (datalist1.length > 0) {
                        $('.searchbar-not-found-reapay').hide();
                        $(".searchbar-found-repay").removeClass('hide');
                        if (datalist1.length - 20 < 0) {
                            Core.App.detachInfiniteScroll(".infinite-scroll-repay");
                        }
                    } else {
                        $('.searchbar-not-found-reapay').show();
                    }
                });
            } else {
                if (init) {
                    mBorrowpage = 1;
                    Core.App.attachInfiniteScroll("#findSheet .infinite-scroll");
                }
                Core.Service.get('app/driverLoan/listDriverLoan', {
                    "currentPage": mBorrowpage,   //当前页 int
                    "rows": 20          //每页行数 int
                }, function (result) {
                    console.log(result);
                    var datalist = result['content']['dataList'];
                    var finalDiv = document.createElement("div");
                    for (var i = 0; i < datalist.length; i++) {
                        var returnDive = App.createHtml(datalist[i], vue.type);
                        finalDiv.appendChild(returnDive);
                    }
                    $("#findSheet .search-content").html(finalDiv);
                    if (datalist.length > 0) {
                        $('.searchbar-not-found').hide();
                        $(".searchbar-found").removeClass('hide');
                        if (datalist.length - 20 < 0) {
                            Core.App.detachInfiniteScroll(".infinite-scroll");
                        }
                    } else {
                        $('.searchbar-not-found').show();
                    }
                });
            }
        },
        getShallRepay: function () {
            console.log("请求接口获取应还金额");
            Core.Service.get('app/driverLoan/getShallRepay', {}, function (result) {
                console.log(result);

                var content = result['content'];
                var repayAmount = content['shallRepayAmount'];
                var repayDate = content['shallRepayDate'];
                var exceedFee = content['exceedFee'];
                var repayNumber = content['shallRepayNumber'];

                vue.shallRepayAmount = Core.Utils.formatMoney(repayAmount, 2);

                if (repayAmount > 0) {
                    if (exceedFee > 0 && repayNumber > 1) {
                        vue.shallRepayTips = "已出账单应还金额（包含逾期利息）";
                        vue.shallRepayDate = '累计应还款' + repayNumber + '笔';
                    } else {
                        vue.shallRepayDate = '应还日期：' + repayDate;
                    }
                } else {
                    vue.shallRepayDate = '';
                }

            });
        },
        getListDriverLoan: function (type) {
            if (type == '1') {
                vue.type = '1';
                console.log("请求接口获取还款记录");
                Core.Service.get('app//driverLoan/listDriverLoanRepay', {
                    "currentPage": mRepaypage,   //当前页 int
                    "rows": 10          //每页行数 int
                }, function (result) {
                    console.log(result);
                    var content = result['content'];
                    var datalist = content['dataList'];
                    for (var i = 0; i < datalist.length; i++) {
                        datalist[i]['id'] = "static" + Math.round(Math.random() * 10000);  //生成唯一id ，赋值颜色
                    }
                    vue.applyRecords = content['dataList'] || [];
                });
            } else {
                vue.type = '';
                console.log("请求接口获取借款记录");
                Core.Service.get('app/driverLoan/listDriverLoan', {
                    "currentPage": mBorrowpage,   //当前页 int
                    "rows": 50          //每页行数 int
                }, function (result) {
                    console.log(result);
                    var content = result['content'];

                    var datalist = content['dataList'];

                    for (var i = 0; i < datalist.length; i++) {
                        datalist[i]['id'] = "static" + Math.round(Math.random() * 10000) //生成唯一id ，赋值颜色

                    }
                    vue.applyRecords = datalist || [];


                    console.log($("#contain"))
                    $("#contain").scroll(function () {
                        console.log(11)
                        var $this = $(this),
                            viewH = $(this).height(),//可见高度
                            contentH = $(this).get(0).scrollHeight,//内容高度
                            scrollTop = $(this).scrollTop();//滚动高度
                        if (scrollTop / (contentH - viewH) >= 0.95) { //到达底部100px时,加载新内容
                            // 这里加载数据..

                            console.log("ddddddddddddd");
                        }
                    });
                });
            }


        },
        createHtml: function (item, type) {
            var returnDiv = document.createElement("div");
            var topDiv = document.createElement("div");
            topDiv.setAttribute("style", "display: flex;flex-direction: row;justify-content: space-between;padding-top: 10px");
            var loanAmountDiv = document.createElement("div");
            loanAmountDiv.setAttribute("style", "color: #333;font-size: 15px;padding-left: 15px; font-weight: bold")
            if (type == "1") {
                loanAmountDiv.innerHTML = item.repaidAmount;
            } else {
                loanAmountDiv.innerHTML = item.loanAmount;
            }
            var currentAmountDiv = document.createElement("div");
            currentAmountDiv.setAttribute("style", "color: #333;font-size: 14px;padding-right: 15px;");
            if (type == "1") {

            } else {
                if ("using" == item.loanStatus) {
                    if (item.currStagesShallRepay > 0) {
                        currentAmountDiv.innerHTML = "本期应还（元）：" + item.currStagesShallRepay;
                    }
                }
            }
            topDiv.appendChild(loanAmountDiv);
            topDiv.appendChild(currentAmountDiv);
            var bottomDiv = document.createElement("div");
            bottomDiv.setAttribute("style", "display: flex;flex-direction: row;justify-content: space-between;padding-bottom:10px;margin-top: 5px");
            var dataAmountDiv = document.createElement("div");
            dataAmountDiv.setAttribute("style", "color: #333;font-size: 14px;padding-left: 15px;")
            if (type == "1") {
                dataAmountDiv.innerHTML = item.repaidDate;
            } else {
                dataAmountDiv.innerHTML = item.loanDate;
            }
            var statusContainer = document.createElement("div");
            statusContainer.setAttribute("style", "display: flex;flex-direction: row;padding-right: 15px");
            var rightImg = document.createElement("img");
            rightImg.setAttribute("width", "6px");
            rightImg.setAttribute("height", "12px");
            rightImg.setAttribute("src", "../img/icon/icon_right.png");
            rightImg.setAttribute("style", "padding-top: 3px");
            var statusDiv = document.createElement("div");
            if (type == "1") {
                statusDiv.innerHTML = "还款明细";
                statusDiv.setAttribute("style", "font-size: 14px;padding-right: 15px;");

            } else {
                if ("lending" == item.loanStatus) {
                    statusDiv.innerHTML = "放款中";
                    statusDiv.setAttribute("style", "color: #08b147;font-size: 14px;padding-right: 15px;");
                } else if ("refuse" == item.loanStatus) {
                    statusDiv.innerHTML = "已拒绝";
                    statusDiv.setAttribute("style", "color: #FF6E40;font-size: 14px;padding-right: 15px;");
                } else if ("using" == item.loanStatus) {
                    statusDiv.innerHTML = "使用中";
                    statusDiv.setAttribute("style", "color: #2f81eb;font-size: 14px;padding-right: 15px;");
                } else if ("closed" == item.loanStatus) {
                    statusDiv.setAttribute("style", "color: #999;font-size: 14px;padding-right: 15px;");
                    if (item.havaExpensePhotos) {
                        statusDiv.innerHTML = "已结清";
                    } else {
                        statusDiv.innerHTML = "已结清(未上传凭证)";
                    }
                }
            }
            statusContainer.appendChild(statusDiv);
            statusContainer.appendChild(rightImg);
            bottomDiv.appendChild(dataAmountDiv);
            bottomDiv.appendChild(statusContainer);
            var lineDiv = document.createElement("div");
            lineDiv.setAttribute("style", "background-color: #f2f2f2; height: 1px")
            returnDiv.appendChild(topDiv);
            returnDiv.appendChild(bottomDiv);
            returnDiv.appendChild(lineDiv);

            if (type == "1") {
                dataAmountDiv.innerHTML = item.repaidDate;
            } else {
                dataAmountDiv.innerHTML = item.loanDate;
            }

            if (type == "1") {
                returnDiv.setAttribute("onclick", "gotoReapy(" + item.repaidId + ")")

            } else {
                returnDiv.setAttribute("onclick", "gotoborrow(" + item.demandId + ")")
            }


            return returnDiv;
        }
    };
    Core.init(App);
    module.exports = App;
});
