/**
 * Created by chengcai on 18/06/16.
 */
define(function (require, exports, module) {
    var native = require("js/modules/hybridapi");
    var Core = require('js/modules/core/core');
    var $vue;
    var expensePhotosArray = Core.Cache.get('expensePhotos');
    var tempArray = [];

    var App = {
        init: function () {
            console.log("页面js初始化成功!");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    bigimg: "",

                },
                methods: {
                    delete: function () {
                        console.log("删除当前页面的图片");
                        Core.App.confirm('确认删除该图片？', function () {

                            var container = document.getElementById("img-container");
                            var img = container.getElementsByTagName("img");
                            var deleImg = "";
                            for (var i = 0; i < img.length; i++) {
                                if (img[i].getAttribute("data") == $vue.bigimg) {
                                    console.log("删除图片" + $vue.bigimg);
                                    img[i].remove();
                                    deleImg = $vue.bigimg;
                                    break;
                                }
                            }

                            for (var i = 0; i < expensePhotosArray.length; i++) {
                                if (expensePhotosArray[i]['url'] == deleImg) {
                                    expensePhotosArray[i]['isDelete'] = false;
                                    break;
                                }
                            }

                            for (var i = 0; i < tempArray.length; i++) {
                                if (tempArray[i]['url'] == deleImg) {
                                    tempArray.remove(i);
                                    break;
                                }
                            }

                            Core.Page.back();
                        });
                    },
                    commitImgView: function () {
                        console.log('提交');
                        var demandId = Core.Cache.get('demandId');
                        var commitArray = [];

                        // for (var i = 0; i < expensePhotosArray.length; i++) {
                        //     commitArray.push(JSON.stringify(expensePhotosArray[i]))
                        // }
                        // for (var i = 0; i < tempArray.length; i++) {
                        //     commitArray.push(JSON.stringify(tempArray[i]))
                        // }

                        commitArray = commitArray.concat(expensePhotosArray);
                        commitArray = commitArray.concat(tempArray);
                        var expensePhotosArrayString = JSON.stringify(commitArray);

                        var dict = {
                            url: serverAddress + '/app/driverLoan/updateExpensePhoto',
                            type: "post",
                            data: {
                                demandId: demandId,
                                expensePhotos: expensePhotosArrayString
                            },
                            isEncrypt: '0'
                        };

                        native.netWorkRequest(dict, function (result) {
                            console.log(result);
                            Core.App.alert('上传凭证成功！', '', function () {
                                Core.Page.changePage('driverLoanBorrowDetail.html', true);
                            });
                        });

                    }
                }
            });
            this.initView();
        },
        initView: function () {
            for (var i = 0; i < expensePhotosArray.length; i++) {
                if (expensePhotosArray[i]['isDelete'] == false) {
                    continue;
                }
                var img = document.createElement("img");
                img.setAttribute("id", "view" + i);
                console.log("cc"+$("#img-container").width()*0.33);
                img.setAttribute("style", "width: 30%;height:"+$("#img-container").width()*0.3+"px");

                img.setAttribute("data", expensePhotosArray[i]['url']);
                img.src = expensePhotosArray[i]['smallUrl'];
                img.onclick = function () {
                    console.log("查看大图");
                    $vue.bigimg = $(this).attr('data');
                    Core.Page.changePageName('sheetList');
                }

                $("#img-container").append(img);


            }

            var addImg = document.createElement("img");
            addImg.setAttribute("id", "viewAdd");
            addImg.setAttribute("style", "width: 30%;height: 30%");
            addImg.src = '../img/app/icon_select.png';
            $("#img-container").append(addImg);

            var addBlankImg = document.createElement("img");
            addBlankImg.setAttribute("id", "viewAdd");
            addBlankImg.setAttribute("style", "width: 30%;height: 0px; margin-bottom: 0px !important;");
            $("#img-container").append(addBlankImg);




            $("#viewAdd").click(function () {
                console.log("调用原生相册和相机");

                var count = 0;
                for (var i = 0; i < expensePhotosArray.length; i++) {
                    if (expensePhotosArray[i]['isDelete'] == false) {
                        continue;
                    }
                    count++;
                }
                for (var i = 0; i < tempArray.length; i++) {
                    count++;
                }

                if (count >= 30) {
                    native.showToast("消费凭证不能超过30张");
                } else {
                    native.selectImage(function (result) {

                        var temp = {
                            url: result['bigImg'],
                            smallUrl: result['smallImg'],
                            isDelete: true
                        };
                        tempArray.push(temp);

                        var img = document.createElement("img");
                        img.setAttribute("id", "view" + i);
                        img.setAttribute("style", "width: 30%;height:"+$("#img-container").width()*0.3+"px");
                        img.setAttribute("data", result['bigImg']);
                        img.src = result['smallImg'];
                        img.onclick = function () {
                            console.log("查看大图");
                            $vue.bigimg = $(this).attr('data');
                            Core.Page.changePageName('sheetList');
                        }
                        $("#viewAdd").before(img);
                    });
                }
            });
        }


    };
    window.App = App;
    // window.refresh = App.findApplyList;
    Core.init(App);
    module.exports = App;
});