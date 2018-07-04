/**
 * Created by chengcai on 18/05/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var App;
    var vue;
    var isCarLoan;
    var status;
    var refuseReason;
    App = {
        init: function () {
            console.log("车主贷状态页面初始化");
            vue = new Vue({
                el: '#vue_bind',
                data: {
                    applyText: "",
                    showApplText: false,
                    tipText: "",
                    showTipText: false,
                },
                methods: {

                    gotoApply: function () {

                        var codeArray = ['1','2','3','4'];
                        native.requestPermission(codeArray,function (code) {

                            if (code == true)
                            {
                                if (status == 'notApply')
                                {
                                    if (isCarLoan == 'Y')
                                    {
                                        console.log("购车贷用户用户申请车主贷");

                                        var dict = {
                                            url : serverAddress + '/app/driverLoan/openDriverLoan',
                                            type : "post",
                                            data : {isCarLoanDriver:"1"},
                                            isEncrypt : '1'
                                        };

                                        native.netWorkRequest(dict,function (result) {
                                            console.log(result);
                                            native.showToast('车主贷申请成功！');
                                        });


                                    }else
                                    {
                                        console.log("进入车主贷申请页面");
                                        Core.Page.changePage('driverLoanApply.html', true);
                                    }
                                }else if (status == 'refuse')
                                {

                                    if (refuseReason == "Reason-8" || refuseReason == "Reason-7")
                                    {
                                        console.log("进入车主贷修改资料页面");
                                        Core.Page.changePage('driverLoanApply.html', true);
                                    }
                                }else if (status == 'success')
                                {
                                    native.showToast("您已成功开通车主贷！");
                                }else if (status == 'isPending')
                                {
                                    // native.showToast("您已提交资料，请耐心等待审核！");
                                }else
                                {
                                    native.showToast("获取状态失败，请稍后重试！");
                                }

                            }
                        });
                        

                    },
                    goBack: function () {
                       native.back();
                    }
                }

            });
            this.initEvents();
            this.getDriverLoanApplyStatus();

            var backBtn = document.getElementById('goBackID');
            backBtn.onclick = function () {
              native.back();
            };

        },
        initEvents: function () {

        },
        getDriverLoanApplyStatus: function () {
            console.log("请求接口获取车主贷申请状态");
            Core.Service.get('app/driverLoan/getAllStateAndPlan', {
            }, function (result) {
                vue.showApplText = true;
                vue.showTipText = true;

                var rootContent = result['content'];
                var driverLoanApplyStatus = rootContent['driverLoanApplyStatus'];

                var content = driverLoanApplyStatus['content'];
                status = content['status'];

                var appCarLoan = rootContent['appCarLoan'];
                isCarLoan =  appCarLoan['paymentPlanFlag'];

                if ("notApply" == status) {
                    vue.applyText = "立即申请";
                    vue.tipText = "“贷”你致富";
                    Core.Cache.set('driverLoanStatus', "0");

                } else if ("isPending" == status) {
                    vue.applyText = "申请提交成功";
                    vue.tipText = "我们将在1个工作日内审核您提交的信息,请耐心等待...";
                    Core.Cache.set('driverLoanStatus', "0");

                } else if ("refuse" == status) {
                    refuseReason = content['rejectReason'];
                    if (refuseReason == "Reason-8" || refuseReason == "Reason-7") {
                        vue.applyText = "重新提交申请";
                        vue.tipText = "照片不清或上传错误";

                    } else {
                        vue.applyText = "重新提交申请";
                        vue.tipText = "很抱歉，您未通过审核,您可两个月后重新提交申请";
                    }
                    var returnReason = content['returnReason'];
                    Core.Cache.set('driverLoanStatus', "-1");
                    Core.Cache.set('returnReason', returnReason);

                }else if ("success" == status)
                {
                    vue.applyText = "立即申请";
                    vue.tipText = "“贷”你致富";
                    Core.Cache.set('driverLoanStatus', "0");
                }
                else {
                    vue.applyText = "立即申请";
                    vue.tipText = "“贷”你致富";
                    native.showToast("获取状态失败");
                }

            },function (error) {
                if (typeof error !== 'undefined'
                    && typeof error['msg'] !== 'undefined') {
                    console.log(error['msg']);
                    native.showToast(error['msg']);
                }else
                {
                    native.showToast('网络不给力，请稍后重试！');
                }
            });
        }
    };
    Core.init(App);
    module.exports = App;
});
