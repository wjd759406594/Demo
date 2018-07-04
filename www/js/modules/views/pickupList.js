define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var page, searchObj;
    var $remarks = $("#remarks");
    var sheetId;
    var today,datePicker;
    var App = {
        init: function () {
            console.log("初始化");
            this.initEvents();
            this.initPage();
            today = new Date().GetDay(1, 'none');
            datePicker =Core.Utils.initRangeDatePicker("#range-time");
            var timeText = today + " - " + today;
            $('#range-time').val(timeText);
        },
        initPage: function () {
            $$(document).on('pageAfterAnimation', '.page[data-page="findSheet"]', function () {
                //查询运单列表
                App.findSheetList();
            });
        },
        refresh: function () {
            if (Core.App.mainView.activePage.name == "findSheet") {
                App.findSheetList();
                return false;
            }
        },
        initEvents: function () {
            $('body').on('click', '#search-yd', function () {
                var rangeTimeArray = $('#range-time').val().split(' - ');
                var start = rangeTimeArray[0] + " 00:00:00";
                var end = rangeTimeArray[1] + " 23:59:59";

                var isPrivate = $("#isPrivate:checked").length > 0 ? 1 : 0;
                var sheetTmp = $("#search-sheetNoShort").val();
                var sheetNoAbbr = "";
                var sheetNo = "";
                var sheetNoConsign = $("#search-sheetNoConsign").val();
                if (sheetTmp.length <= 6) {
                    switch (sheetTmp.length) {
                        case 1:
                            sheetNoAbbr = "00000" + sheetTmp;
                            break;
                        case 2:
                            sheetNoAbbr = "0000" + sheetTmp;
                            break;
                        case 3:
                            sheetNoAbbr = "000" + sheetTmp;
                            break;
                        case 4:
                            sheetNoAbbr = "00" + sheetTmp;
                            break;
                        case 5:
                            sheetNoAbbr = "0" + sheetTmp;
                            break;
                        case 6:
                            sheetNoAbbr = sheetTmp;
                            break;
                    }
                } else {
                    sheetNo = Core.Cache.get("sheetPre") + sheetTmp;
                }

                var searchObj = {
                    toCustomerPhone: $("#search-toCustomerPhone").val(),
                    fromCustomerPhone: $("#search-fromCustomerPhone").val(),
                    sheetNo: sheetNo,
                    sheetNoAbbr: sheetNoAbbr,
                    sheetNoConsign: sheetNoConsign,
                    beginTime: start,
                    privateFlag: 2,
                    endTime: end,
                    deliveryUserId: Core.Cache.get('userId')
                };
                Core.Cache.set("searchObj", searchObj);
                page = 1;
                Core.Page.changePage("findPickupSheet.html");
            }).on('change', '#chooseTime', function () {
                var id = $(this).val();
                if (id == 0) {
                    $('.chooseTime').show();
                    datePicker.open();
                } else {
                    var timeText = new Date().GetDay(id, "none") + " - " + today;
                    $('#range-time').val(timeText);
                    $('.chooseTime').hide();
                }
            }).on('refresh', '#findSheet .pull-to-refresh-content', function () {
                App.findSheetList(true);
            }).on('infinite', "#findSheet .infinite-scroll", function () {
                if (Core.isLoading) return;
                page++;
                searchObj.pageNo = page;
                Core.Service.get('api/auth/v1/ltl/sheet/querySheet', searchObj, function (results) {
                    var data = results['data'];
                    var sheets = {
                        sheets: data['rows']
                    };
                    var html = Core.Template.render('sheetTmpl', sheets);
                    $("#findSheet .search-content").append(html);
                    if (data['total'] - pageSize * page <= 0) {
                        Core.App.detachInfiniteScroll(".infinite-scroll");
                    }
                });
            }).on('click', '.pickupFee', function () {
                var sheet = $(this).data('val');
                Core.Cache.set('lastPickupSheet', sheet);
                Core.Page.changePage("pickupDetail.html", true);
            }).on('click', '.updateRemarks', function () {
                $remarks.val('');
                var sheet = $(this).data('val');
                Core.Cache.set("exceptionSheet", sheet);
                Core.Page.changePage('exceptionReport.html', true);
            }).on('click', '#uploadRemark', function () {
                var remark = $remarks.val();
                if (!remark) {
                    native.showToast("请输入上报内容");
                    return false;
                }
                Core.Service.post('api/auth/v1/ltl/sheet/updateRemarks', {
                    id: sheetId,
                    remarks: remark
                }, function () {
                    native.showToast("上传成功");
                    $remarks.val('');
                    sheetId = "";
                    Core.Page.back();
                });
            });
        },
        findSheetList: function (init) {
            if (init) {
                page = 1;
                Core.App.attachInfiniteScroll("#findSheet .infinite-scroll");
            }
            searchObj = Core.Cache.get("searchObj");
            console.log(searchObj);
            searchObj.pageNo = page;
            searchObj.pageSize = pageSize;

            Core.Service.get('api/auth/v1/ltl/sheet/querySheet', searchObj, function (results) {
                var data = results['data']['rows'];
                var sheets = {
                    sheets: data
                };
                var html = Core.Template.render('sheetTmpl', sheets);
                $("#findSheet .search-content").html(html);
                if (data.length > 0) {
                    $('.searchbar-not-found').hide();
                    $(".searchbar-found").removeClass('hide');
                    if (results['data']['total'] - pageSize <= 0) {
                        Core.App.detachInfiniteScroll(".infinite-scroll");
                    }
                } else {
                    $('.searchbar-not-found').show();
                }
            });
        },
        initPicker: function (el, flag) {
            var today = new Date();
            var year = today.getFullYear();
            var month = today.getMonth();
            var day = (today.getDate() < 10 ? '0' + today.getDate() : today.getDate());
            var minutes = flag == "start" ? "00" : "23";
            var seconds = flag == "start" ? "00" : "59";
            Core.App.picker({
                input: el,
                toolbar: true,
                rotateEffect: false,
                value: [year, month, day, minutes, seconds],

                onChange: function (picker, values) {
                    var daysInMonth = new Date(picker.value[0], picker.value[1] * 1 + 1, 0).getDate();
                    if (values[2] > daysInMonth) {
                        picker.cols[2].setValue(daysInMonth);
                    }
                    if (values[1] > month) {
                        picker.cols[1].setValue(month);
                    }
                    if (values[2] > day) {
                        picker.cols[2].setValue(day);
                    }
                },

                formatValue: function (p, values) {
                    var displayMonth = values[1] * 1 + 1;
                    displayMonth = displayMonth < 10 ? "0" + displayMonth : displayMonth;
                    return values[0] + '-' + displayMonth + '-' + values[2] + ' ' + values[3] + ':' + values[4] + ":" + seconds;
                },

                cols: [
                    // Years
                    {
                        values: (function () {
                            var arr = [];
                            for (var i = 2013; i <= today.getFullYear(); i++) {
                                arr.push(i);
                            }
                            return arr;
                        })()
                    },
                    // Months
                    {
                        values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                        displayValues: ('一月 二月 三月 四月 五月 六月 七月 八月 九月 十月 十一月 十二月').split(' '),
                        textAlign: 'left'
                    },
                    // Days
                    {
                        values: (function () {
                            var arr = [];
                            for (var i = 1; i <= 31; i++) {
                                arr.push(i < 10 ? '0' + i : i);
                            }
                            return arr;
                        })()
                    },
                    // Space divider
                    {
                        divider: true,
                        content: '  '
                    },
                    // Hours
                    {
                        values: (function () {
                            var arr = [];
                            for (var i = 0; i <= 23; i++) {
                                arr.push(i < 10 ? '0' + i : i);
                            }
                            return arr;
                        })()
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Minutes
                    {
                        values: (function () {
                            var arr = [];
                            for (var i = 0; i <= 59; i++) {
                                arr.push(i < 10 ? '0' + i : i);
                            }
                            return arr;
                        })()
                    }
                ]
            });
        }
    };
    window.refresh = App.refresh;
    Core.init(App);
    module.exports = App;
});