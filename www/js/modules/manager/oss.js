/**
 * 阿里云OSS上传
 * @auther DeonZhu
 */
define(function (require, exports, module) {
    var native = require("js/modules/hybridapi");
    var Core = require('js/modules/core/core');
    var ossConfig;
    //var OSS = window.OSS;
    // function upload(oss, fileName, base64, cb) {
    //     Core.App.showPreloader();
    //     base64 = base64.substr(22);
    //     fileName = Core.Cache.get('companyNo') + "/" + (new Date()).Format('yyyyMM') + "/" + fileName + ".jpg";
    //     oss.put(fileName, new OSS.Buffer(base64, 'base64')).then(function (result) {
    //         Core.App.hidePreloader();
    //         console.log(result);
    //         cb(result);
    //     }).catch(function (err) {
    //         Core.App.hidePreloader();
    //         Core.App.alert(err);
    //     });
    // }
    module.exports = {
        init: function () {
            ossConfig = Core.Cache.get('oss');
            if (!ossConfig) {
                console.log('aaa');
                var loginName = localStorage.getItem('loginName');
                var pwd = localStorage.getItem('password');
                if (loginName && pwd) {
                    Core.Service.get(loginUrl + 'api/anon/v1/auth/login', {
                        appKey: appName,
                        loginName: loginName,
                        password: pwd,
                        deviceCode: "ffffffff-93ea-2e2e-ffff-ffff9c94cccd",
                        appVer: "21",
                        longitude: 0,
                        latitude: 0
                    }, function (result) {
                        var data = result['data'];
                        Core.Cache.set('oss', data['attributes']['oss']);
                        location.reload();
                    });
                } else {
                    Core.App.alert("无权访问,请返回重新登录", function () {
                        Core.Page.back();
                    });
                }
            } else {
                $('body').on('click', '.input-file', function () {
                    var that = $(this);
                    //noinspection JSValidateTypes
                    var $input = that.children('input');
                    var sheetNo = $(this).data('id');
                    var type = $(this).data('type') ? $(this).data('type') : "pickUp";
                    native.takePhoto(sheetNo, function (data) {
                        that.attr("style",
                            'background:url("data:image/png;base64,' + data + '");background-size: 100% 100%;'
                        );
                        $input.val(Core.Cache.get('companyNo') + "/" + (new Date()).Format('yyyyMM') + "/" + type + '/' + guid() + ".jpg");
                        $input.data('base', data);
                    });
                });
            }
        },
        /**
         * 异步上传
         * @param fileName 文件名称
         * @param fileBase 图片base64
         */
        asyncUpload: function (fileName, fileBase) {
            if (fileName && fileBase) {
                native.pickUpUpload({
                    region: ossConfig['region'],
                    accessKeyId: ossConfig['accessKeyId'],
                    accessKeySecret: ossConfig['accessKeySecret'],
                    bucket: ossConfig['bucket'],
                    fileBase: fileBase,
                    fileName: fileName
                })
            }
        }
    };
});