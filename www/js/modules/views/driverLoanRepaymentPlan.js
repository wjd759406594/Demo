/**
 * Created by chengxiaocai on 18/06/19.
 */
define(function (require, exports, module) {
    var native = require("js/modules/hybridapi");
    var Core = require('js/modules/core/core');
    var $vue;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    repayDate: "",
                    repayAmount: "",
                    fee: "",
                    interest: "",
                    planList: [],
                },


            });
            this.findPlanList();
        },

        findPlanList: function () {
            var demandId = Core.Cache.get('demandId');
            Core.Service.get('app/driverLoan/getDriverLoanRepayPlan', {demandId: demandId}, function (results) {

                $vue.planList = results['content']['dataList'] || [];
                console.log("cc" + $vue.planList)
            });
        }
    };
    window.App = App;
    // window.refresh = App.findApplyList;
    Core.init(App);
    module.exports = App;
});