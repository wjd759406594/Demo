define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var Parse = window.Parse;
    var Order = Parse.Object.extend("Order");
    var $vue;
    var App = {
        init: function () {
            console.log("初始化");
            $vue = new Vue({
                el: '#orderListBound',
                data: {
                    orderList: []
                },
                watch: {
                    orderList:function(val){
                        console.log(val);
                    }
                },
                methods: {
                    createSheet: function (item) {
                        var order = item.attributes;
                        order.objectId = item.id;
                        Core.Cache.set('lastOrder', item.attributes);
                        Core.Page.changePage("fastCreate.html", true);
                    },
                    updateState: function (item) {
                        App.updateState(item);
                    }
                }
            });
            App.refresh();
            $('body').on('refresh', '.infinite-scroll', function () {
                App.refresh();
            });
        },
        updateState: function (item) {
            Core.Service.run('changeOrderState', {
                objectId: item.id,
                state: "已确认"
            }, function () {
                item.attributes.state = "已确认";
                native.showToast("确认成功");
            });
        },
        refresh: function () {
            $vue.orderList = [];
            Core.Service.run('queryOrder', {
                receiptType: "上门取货",
                companyNo: Core.Cache.get('sheetPre') + ""
            }, function (results) {
                if (results && results.length > 0) {
                    var tmp = [];
                    $.each(results,function (i, v) {
                          var order ={
                              attributes:JSON.parse(JSON.stringify(v)),
                              id:v.id
                          };
                          tmp.push(order);
                    });
                    $vue.orderList = tmp;
                } else {
                    native.showToast("未查到任何信息");
                }
            });
        }
    };
    window.refresh = App.refresh;
    Core.init(App);
    module.exports = App;
});