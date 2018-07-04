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
            console.log("借款详情页面初始化");
            vue = new Vue({
                el: '#vueBound',
                data: {
                    show: true,
                    usingAmount: "",
                    period: "",
                    loanAmount: "",
                    startDate: "",
                    endDate: "",
                    loanStatus: "",
                    repaidAmount: "",
                    repaidAmountAndpoundage: "",
                    repaidInterest: "",
                    poundage: "",
                    penalty: "",
                    expensePhotosSize: "",
                    showExpensePhotosSize: false,
                    showperiod: false,
                    showFaxi: false,
                    title: ""

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
                    }
                }
            });
            this.initEvents();
            this.getDriverLoan();
        },
        initEvents: function () {
            $('#driverloanpages').on('click', '#driverloan-apply', function () {
                console.log("提交申请");

            });
        },
        getDriverLoan: function () {
            console.log("请求接口获取借款详情");
            var demandId = Core.Cache.get('demandId');
            Core.Service.get('app/driverLoan/getDriverLoan', {
                demandId: demandId
            }, function (result) {
                console.log(result);

                var content = result['content'];

                if (content['contractUrl'] != 'undefined') {
                    var tmpArray = content['contractUrl'];
                    contract = tmpArray[0]['fileUrl'];
                }

                vue.usingAmount = Core.Utils.formatMoney(content['usingAmount'], 2)
                vue.period = content['period'];
                vue.loanAmount = Core.Utils.formatMoney(content['loanAmount'], 2);
                vue.startDate = content['startDate'];
                vue.endDate = content['endDate'];
                var loanStatus = content['loanStatus'].toLowerCase();
                switch (loanStatus) {
                    case 'lending':
                        vue.loanStatus = '放款中';
                        $("#showstatus").css("color", "#08b147");
                        $("#loandetail").css("display", "none");
                        $("#expensiveimg").css("display", "none");
                        vue.title = "申请金额（元）";
                        canGotoPlan = false;
                        break;
                    case 'using':
                        vue.loanStatus = '使用中';
                        $("#showstatus").css("color", "#2f81eb");
                        canGotoPlan = true;
                        vue.title = "使用中金额（元）";


                        break;
                    case 'closed':
                        vue.loanStatus = '已结清';
                        $("#showstatus").css("color", "#666666");
                        vue.title = "使用中金额（元）";


                        canGotoPlan = true;
                        break;
                    case 'refuse':
                        vue.loanStatus = '已拒绝';
                        $("#showstatus").css("color", "#FF6E40");
                        $("#loandetail").css("display", "none");
                        $("#expensiveimg").css("display", "none");
                        vue.title = "申请金额（元）";
                        canGotoPlan = false;
                        break;
                    default:
                        vue.loanStatus = '';
                        break;
                }
                vue.showperiod = true;
                vue.repaidAmount = Core.Utils.formatMoney(content['repaidAmount'], 2);
                vue.repaidInterest = Core.Utils.formatMoney(content['repaidInterest'], 2);
                vue.poundage = Core.Utils.formatMoney(content['poundage'], 2);
                vue.penalty = Core.Utils.formatMoney(content['penalty'], 2);
                if (content['penalty'] > 0) {
                    vue.showFaxi = true;
                }
                vue.repaidAmountAndpoundage = Core.Utils.formatMoney(Core.Utils.add(content['repaidAmount'], content['poundage']), 2);
                var expensePhotosOrigin = [];

                if (content['expensePhotos'] != null && content['expensePhotos'].length > 0) {
                    expensePhotosOrigin = JSON.parse(content['expensePhotos']);
                }

                var deleteExpensePhotosCount = 0;
                var expensePhotos = [];
                for (var i = 0; i < expensePhotosOrigin.length; i++) {
                    if (expensePhotosOrigin[i]['isDelete'] == true) {
                        deleteExpensePhotosCount++;
                    }
                }
                vue.expensePhotosSize = deleteExpensePhotosCount;
                if (deleteExpensePhotosCount > 0) {
                    vue.showExpensePhotosSize = true;
                }
                Core.Cache.set('expensePhotos', expensePhotosOrigin);
            });
        }
    };
    Core.init(App);
    module.exports = App;
});
