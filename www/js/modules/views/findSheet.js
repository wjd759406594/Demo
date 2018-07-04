/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var page;
    var searchObj;
    var App = {
        init: function () {
            console.log("搜索初始化成功");
            page = 1;
            this.initEvents();
            this.initList();
        },
        initList: function (init) {
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
                    Core.App.searchbar('.searchbar', {
                        searchList: '.list-block-search',
                        searchIn: '.item-title,.item-subtitle,.sheet-mdd'
                    });
                    if (results['data']['total'] - pageSize <= 0) {
                        Core.App.detachInfiniteScroll(".infinite-scroll");
                    }
                } else {
                    $('.searchbar-not-found').show();
                }
            });
        },
        initEvents: function () {
            $('#findSheet').on('refresh', '.pull-to-refresh-content', function () {
                App.initList(true);
            }).on('click','.show-detail',function(){
                var no  = $(this).data('val');
                Core.Cache.set('sheetNo',no);
                Core.Page.changePage('sheetDetail.html');
            });
            $("#findSheet .infinite-scroll").on('infinite', function () {
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
            });
        },
        refresh: function () {
            this.initList(true);
        }
    };
    module.exports = App;
});