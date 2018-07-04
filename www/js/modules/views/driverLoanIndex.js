/**
 * Created by chengcai on 18/05/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var App;
    var availableAmount;
    App = {
        init: function () {
            console.log("车主贷状态页面初始化");

            this.getDriverAmountLimit();

            var recond = document.getElementById('goto-borrow-record');
            var apply = document.getElementById('goto-borrow');
            var question = document.getElementById('goto_question');

            recond.onclick = function () {
                console.log("点击借还记录");

                Core.Page.changePage('driverLoanRecords.html', true);
            };

            apply.onclick = function () {
                console.log("点击去借款");

                //检查权限
                var codeArray = ['1','2','3','4'];
                native.requestPermission(codeArray,function (code){

                    if (code == true)
                    {
                        if (availableAmount > 0) {
                            Core.Page.changePage('driverLoanBorrow.html', true);
                            Core.Cache.set("avilableAmount",availableAmount);
                        } else {
                            native.showToast('暂无可借金额');
                        }
                    }
                });
            };

            question.onclick = function () {
              native.callDriverLoanQuestions();
            };
        },

        getDriverAmountLimit: function () {
            console.log("请求余额/总额度查询/本期应还 接口");
            Core.Service.get('app/driverLoan/getDriverAmountLimit', {}, function (result) {
                console.log(result);

                var content = result['content'];
                var available_amount = document.getElementById('available-amount');
                var total_amount = document.getElementById('total-amount');
                var bill_amount = document.getElementById('bill-amount');

                availableAmount = content['availableAmount'];

                available_amount.innerText = Core.Utils.formatMoney(content['availableAmount'], 2);
                total_amount.innerText = Core.Utils.formatMoney(content['totalAmount'], 2);
                bill_amount.innerText = '已出账单应还金额(元)：' + Core.Utils.formatMoney(content['shallRepayAmount'], 2);

            }, function (error) {
                if (typeof error !== 'undefined'
                    && typeof error['msg'] !== 'undefined') {
                    console.log(error['msg']);
                    native.showToast(error['msg']);
                } else {
                    native.showToast('网络不给力，请稍后重试！');
                }
            });
        }
    };
    Core.init(App);
    module.exports = App;
});
