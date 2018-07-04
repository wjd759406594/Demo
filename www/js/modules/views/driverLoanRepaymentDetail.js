/**
 * Created by chengcai on 18/05/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var App;
    var vue;
    var contract;
    var canGotoPlan = true;
    App = {
        init: function () {
            console.log("还款详情页面初始化");
            vue = new Vue({
                el: '#vueBound',
                data: {
                    show: false,
                    amount: "",
                    repayTime: "",
                    borrowTime: "",
                    haveReypay: "",
                    borrowAmount: "",
                    thisAmount: "",
                    repaymentList: [],
                    data: {}


                },
                methods: {
                    viewRepaymentPlan: function () {
                        console.log("查看还款计划");
                        if (canGotoPlan) {
                            Core.Page.changePage('driverLoanRepaymentPlan.html', true);

                        }
                    },
                    viewImgView: function () {
                        console.log("查看消费凭证");
                        Core.Page.changePage('driverLoanImgView.html', true);
                    },
                    gotoContract: function () {
                        console.log("查看借款合同");
                        if (contract.length > 0) {
                            native.viewContract(contract);
                        }
                    },
                    gainAmount: function () {
                        var mount = vue.data.currStagesRepayt;

                        return Core.util.formatMoney(mount, 2);

                    },
                    gotoBorrowDetail: function (item) {

                        Core.Cache.set('demandId', item.demandId);
                        Core.Page.changePage('driverLoanBorrowDetail.html', true);

                    }

                }
            });
            this.initEvents();
            this.getDriverLoan();
        },
        initEvents: function () {
            $('#driverloanpages').on('click', '#driverloan-apply', function () {
                console.log("提交申请");
                Core.App.Cache.set('demandId', '123');
            });
        },
        getDriverLoan: function () {
            var repaidId = Core.Cache.get('repaidId');
            Core.Service.get('app/driverLoan/getDriverLoanRepay', {
                repaidId: repaidId
            }, function (result) {
                console.log(result);
                vue.repaymentList = result['content']['dataList'];
                vue.amount = result['content']['currStagesRepayt'];
                vue.repayTime = result['content']['transAccountDate'];
                vue.thisAmount = result['content']['money'];
                vue.borrowAmount = result['content']['loanAmount'];

                vue.show = true;


            });
        }
    };
    Core.init(App);
    module.exports = App;
});
