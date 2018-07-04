define(function (require, exports, module) {
    "use strict";
    var bridge = {
        init: function () {
            if (WebViewJavascriptBridge.init) {
                WebViewJavascriptBridge.init(function (message, responseCallback) {
                    responseCallback("")
                });
                this.hideLoading();
            }
        },
        getBluetoothState: function (cb) {
            WebViewJavascriptBridge.callHandler('getBluetoothState', "", function (state) {
                cb(state['state']);
            });
        },
        getBluetoothInfo: function (cb) {
            WebViewJavascriptBridge.callHandler('getBluetoothInfo', "", function (lists) {
                var tmp = [];
                if (lists.length > 0) {
                    $.each(lists, function (k, v) {
                        tmp.push(v);
                    });
                }
                cb(tmp);
            });
        },
        getConnectionInfo: function (cb) {
            WebViewJavascriptBridge.callHandler('getConnectionInfo', "", cb);
        },
        bluetoothSetting: function (cb) {
            WebViewJavascriptBridge.callHandler('bluetoothSetting', "", cb);
        },
        sign: function (sheet, cb) {
            WebViewJavascriptBridge.callHandler('md5SignSheet', sheet, cb);
        },
        takePhoto: function (sheetNo, cb) {
            sheetNo = sheetNo ? sheetNo : "";
            WebViewJavascriptBridge.callHandler('takePhoto', sheetNo, function (data) {
                // var img = "data:image/png;base64," + data;
                cb(data);
            });
        },
        changePage: function (url) {
            WebViewJavascriptBridge.callHandler('changePage', url);
        },
        back: function () {
            WebViewJavascriptBridge.callHandler('back', location.href);
        },
        restart: function () {
            WebViewJavascriptBridge.callHandler('restart', "");
        },
        download: function (updateUrl) {
            WebViewJavascriptBridge.callHandler('download', updateUrl);
        },
        showToast: function (message) {
            if (window.Core) {
                var Core = window.Core;
                var nt = Core.App.addNotification({
                    title: '',
                    subtitle: '',
                    message: message,
                    closeOnClick: true
                });
                setTimeout(function () {
                    Core.App.closeNotification(nt);
                }, 3000);
            } else {
                WebViewJavascriptBridge.callHandler('showToast', message);
            }
        },
        share: function (message) {
            WebViewJavascriptBridge.callHandler('share', message);
        },
        sendSMS: function (phone, message) {
            WebViewJavascriptBridge.callHandler('sendSMS', {
                phone: phone,
                message: message
            });
        },
        pickUpUpload: function (params) {
            WebViewJavascriptBridge.callHandler('pickUpUpload', params);
        },
        createSheet: function (params) {
            WebViewJavascriptBridge.callHandler('createSheet', params);
        },
        queryDb: function () {

        },
        mediaVibrate: function (code, message) {
            WebViewJavascriptBridge.callHandler('mediaVibrate', {
                code: code,
                message: message
            });
        },
        showLoading: function (message) {
            message = message ? message : "正在加载中...";
            WebViewJavascriptBridge.callHandler('showLoading', message);
        },
        hideLoading: function () {
            WebViewJavascriptBridge.callHandler('hideLoading');
        },
        quit: function () {
            WebViewJavascriptBridge.callHandler('quit');
        },
        scanAddEvent: function () {
            WebViewJavascriptBridge.callHandler('scanAddEvent');
        },
        signEvent: function (userInfo) {
            WebViewJavascriptBridge.callHandler('signEvent', userInfo);
        },
        dataCompress: function (data, cb) {
            WebViewJavascriptBridge.callHandler('dataCompress', data, cb);
        },
        subscribe: function (params) {
            WebViewJavascriptBridge.callHandler('subscribe', {
                "companyNo": params.companyNo + "",
                "userId": params.userId + "",
                "orgId": params.orgId + ""
            });
        },
        unsubscribe: function (params) {
            WebViewJavascriptBridge.callHandler('unsubscribe', {
                "companyNo": params.companyNo + "",
                "userId": params.userId + "",
                "orgId": params.orgId + ""
            });
        },
        connectBluetooth: function (address) {
            WebViewJavascriptBridge.callHandler('connectBluetooth', address, function (message) {
                if (message) {
                    bridge.showToast(message);
                }
            });
        },
        stopBluetooth: function () {
            WebViewJavascriptBridge.callHandler('stopBluetooth', '', function (message) {
                if (message) {
                    bridge.showToast(message);
                }
            });
        },
        /**
         *
         * @param address 蓝牙地址
         * @param type   打印机类型
         * @param start 开始位置
         * @param end   结束位置
         * @param template 打印的数据
         * @param cb 返回function
         * @returns {*}
         */
        print: function (address, type, start, end, template, cb) {
            if (typeof template == "object") {
                template = JSON.stringify(template);
            }
            template = Base64.encode(template);
            var params = {
                "address": address,
                "method": localStorage.getItem('printMod') || 2,
                "type": type,
                "start": start,
                "end": end,
                "template": template
            };
            WebViewJavascriptBridge.callHandler('print', params, function (message) {
                if (message) {
                    //bridge.showToast(message);
                    if (window.Core) {
                        var Core = window.Core;
                        Core.App.confirm(message + "<br>可以尝试再次打印!", "是否进入打印机配置", function () {
                            Core.Page.changePage('printSetting.html', true);
                        });
                    }
                } else {
                    if (cb && typeof cb == "function") {
                        cb();
                    }
                }
            });

        },
        printList: function (address, type, list, cb) {
            console.log({
                "address": address,
                "type": type,
                "list": list
            });
            WebViewJavascriptBridge.callHandler('printList', {
                "address": address,
                "method": localStorage.getItem('printMod') || 2,
                "type": type,
                "list": list
            }, function (message) {
                if (message) {
                    if (window.Core) {
                        var Core = window.Core;
                        Core.App.confirm(message + "<br>可以尝试再次打印!", "是否进入打印机配置", function () {
                            Core.Page.changePage('printSetting.html', true);
                        });
                    }
                } else {
                    if (cb && typeof cb == "function") {
                        cb();
                    }
                }
            });
        },
        gps: function (callBack) {
            WebViewJavascriptBridge.callHandler('gps', "", callBack);
        },
        scanQr: function () {
            WebViewJavascriptBridge.callHandler('scanQr');
        },
        log: function (message) {
            WebViewJavascriptBridge.callHandler('log', message);
        },
        ajax: function (url, parameter, callBack) {
            var data = {
                "url": url,
                "data": parameter
            };
            WebViewJavascriptBridge.callHandler('ajax', data, callBack);
        },
        call: function (phone) {
            WebViewJavascriptBridge.callHandler('call', phone + "");
        },
        setUserInfo: function (userInfo) {
            WebViewJavascriptBridge.callHandler('setUserInfo', userInfo);
        },
        statisticsEvent: function (event) {
            WebViewJavascriptBridge.callHandler('statisticsEvent', event);
        }
    };
    window.bridge = bridge;
    module.exports = bridge;

    (function () {
        $('body').on("click", "a", function (e) {
            e.preventDefault();
            var href = $(this).attr('href');
            if (href.startsWith('tel:')) {
                var phone = href.substr(4, href.length);
                console.log(phone);
                window.Core.App.confirm("是否确认拨打电话:" + phone, "温馨提示", function () {
                    bridge.call(phone);
                });
                return true;
            } else {
                var newWeb = $(this).data('type') && $(this).data('type') == 'new' ? true : false;
                if (href.indexOf('#') === -1) {
                    Core.Page.changePage(href, newWeb);
                }
            }
        });
    })();
});
