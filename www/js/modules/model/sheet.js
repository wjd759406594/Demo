/**
 * Created by DenonZhu on 2017/3/30.
 */
define(function (require) {
    "use strict";
    var Core = require('js/modules/core/core');
    var lxDb = Core.lxDb;
    var IDB = lxDb.getIDB(Core.Cache.get('companyNo'));
    var config = Core.Utils.getConfig();
    var defaultTemplate = Core.Cache.get("ltl.sheet.create.template") || {};
    //     {
    //     "fromCustomerIdCard": {"show": false},
    //     "toCustomerIdCard": {"show": false},
    //     "toCustomerAddress": {"show": true},
    //     "goodsWeight": {"show": true},
    //     "goodsVolume": {"show": true}
    // };
    // {
    //     "fromCustomerIdCard": {
    //         "show": false,
    //         "rule": {"required": {"rule": true, "message": "发货人身份证号码必填"}}
    //     },
    //     "toCustomerIdCard": {"show": false, "rule": {"required": {"rule": true, "message": "收货人身份证号码必填"}}},
    //     "goodsWeight": {"show": true, "rule": {"required": {"rule": true, "message": "货物重量必填"}}},
    //     "goodsVolume": {"show": true, "rule": {"required": {"rule": true, "message": "货物体积必填"}}}
    // };
    return {
        get: function () {
            return {
                objectId: "",
                id: "",
                localSheets: [],
                isEdit: false,
                codFeeMode: config['defaultCodFeeMode'] === undefined ? 1 : config['defaultCodFeeMode'], //1-寄付，2-到付
                fromShopPhone: "", //发货网点号码
                toShopPhone: "", //到货网点号码
                fromCustomerMemberCardNo: "",//会员卡号
                isReturn: 0,//是否原单返回
                sheetNoOriginal: "",//原单号
                sheetNoShortOriginal: "",//原单号短
                sheetNoConsign: "",
                updateToCustomerFee: 1,//是否清除原单到付费用
                memberCardNo: "",//会员卡号
                activity: "", //活动信息
                prePhone: "",  //预填单手机号
                sheetNo: "",                 //运单号
                printSheetNo: "",
                printSheetNoAbbr: "",
                printSheetNoYmd: "",
                sheetNoShort: "",            //运单短号码
                sheetNoManual: "",           //手工单号
                toAreaProvince: "",
                orgOrProvinceName: "",
                fromProvinceName: "",
                toProvinceName: "",
                toRegionMarkerPen: "",
                fromCityName: "",
                toCityName: "",
                fromAreaId: "",                //启运地id
                fromAreaName: "",            //启运地名称
                fromOrgId: "",                 //发货业务区id
                fromOrgName: "",             //发货业务区名称
                fromShopId: "",                //发货网点id
                fromShopName: "",            //发货网点名称
                toRegionName: "",//目的地
                toAreaId: "",                  //目的地id
                toAreaName: "",              //目的地名称
                toOrgId: "",                   //到达业务区id
                toOrgName: "",               //到达业务区名称
                toShopId: "",                  //到货网点id
                toShopName: "",              //到货网点名称
                orgStorageLocation: "",      //库位
                fromCustomerId: "",            //发货客户id
                fromCustomerName: "",        //发货客户名称
                fromCustomerPhone: "",       //发货客户电话
                fromCustomerPhone1: "",      //发货客户备用电话
                fromCustomerAddress: "",     //发货客户地址
                fromCustomerLongitude: "",   //发货客户经度
                fromCustomerLatitude: "",    //发货客户纬度
                fromCustomerIdCard: "",      //发货客户身份证
                fromCustomerCodCardNo: "",      //发货客户卡号（代收货款卡号）
                fromCustomerBank: "",        //发货客户开户行
                fromCustomerBranchBank: "",  //发货客户支行
                fromCustomerAccount: "",     //发货客户账号
                fromCustomerHolder: "",      //发货客户持卡人
                agreementId: "",               //协议id
                agreementNo: "",             //协议编号  月结编号
                agreementCompany: "",        //协议单位  月结单位
                companyNo: "",
                thirdFeeSummaryInfo: "",
                customerServicePhone: "",
                lineBranchNo: "",
                lineBranchName: "",
                toCustomerId: "",              //收货客户id
                toCustomerName: "",          //收货客户名称
                toCustomerPhone: "",         //收货客户电话
                toCustomerPhone1: "",        //收货客户备用电话
                toCustomerAddress: "",       //收货客户地址
                toCustomerLongitude: "",     //收货客户经度
                toCustomerLatitude: "",      //收货客户纬度
                toCustomerIdCard: "",        //收货客户身份证
                goodsName: "",               //货物名称
                goodsAmount: "",            //货物件数
                goodsWeight: "",         //货物重量（千克）
                goodsVolume: "",         //货物体积（立方米）
                goodsSquare: "",       //货物平方 (平方米)
                goodsPackage: "无",            //货物包装
                requirement: "",             //特殊需求（加急，易碎，贵重）
                deliveryMode: config['defaultDeliveryMode'],           //交货方式(1-自提，2-送货)
                defaultPremiumMode: config['defaultPremiumMode'] === undefined ? 2 : config['defaultPremiumMode'],      //1.保费不可填  2.保费可以填
                fromPremium: "",              //发货方保费
                fromBackSheetFee: "",         //发货方回单费
                fromDocumentFee: "",          //发货方工本费
                fromReceiptFee: "",           //发货方接货费
                fromDeliveryFee: "",          //发货方送货费
                fromOtherFee: "",             //发货方其他费（服务费）
                fromForkliftFee: "",          //发货方叉车费
                fromUpFee: "",                //发货方上楼费
                fromPackageFee: "",           //发货方包装费
                toPremium: "",                //提货方保费
                toBackSheetFee: "",           //提货方回单费
                toDocumentFee: "",            //提货方工本费
                toReceiptFee: "",             //提货方接货费
                toDeliveryFee: "",            //提货方送货费
                toOtherFee: "",               //提货方其他费（服务费）
                toForkliftFee: "",            //提货方叉车费
                toUpFee: "",                  //提货方上楼费
                toPackageFee: "",             //提货方包装费
                cod: "",                 //代收货款
                codFee: "",              //代收货款手续费
                billingMode: "",            //计费方式(1-重量体积，2-件数)
                settlePayFee: "",        //转运垫付
                nowPayFee: "",           //现付
                pickPayFee: "",          //提付
                fromCustomerMonthFee: "",//发货方月结
                toCustomerMonthFee: "",  //收货方月结
                backPayFee: "",          //回单付
                pickPayDeduct: "",     //提付扣(三方单存在发货方付时存在)
                codPayFee: "",           //货款付
                rebates: "",             //劳务费
                rebatesSettleMode: 2,      //劳务费（劳务费）结算方式(1-现结，2-月结)
                declaredValue: "",       //申明价值
                premium: "",             //保费
                backSheetFee: "",        //回单费
                backSheetRequirement: "", //回单要求
                documentFee: 0,         //工本费
                receiptFee: "",          //上门收货费
                deliveryFee: "",         //送货费
                payOutFee: "",           //垫付
                otherFee: "",            //服务费
                consignId: "",                 //托运公司id
                consignName: "",             //托运公司名称
                transferId: "",                //中转公司id
                transferName: "",            //中转公司名称
                transferSheetNo: "",         //中转单号
                transferFee: "",         //中转费
                isInvoice: "",              //是否开票(0-否，1-是)
                invoiceTitle: "",            //开票抬头
                sheetFrom: "",              //运单来源（1-手机开票，2-pc开票，3-客户自助）
                salesmanId: "",                //业务员id
                salesmanName: "",            //业务员名称
                salesmanPhone: "",           //业务员电话
                backSheetAmount: "",        //回单张数
                createDate: "",                //创建时间
                remarks: "",                 //备注
                version: 0,                   //版本号
                totalFee: "",                //总运费
                billingModeDesc: "",             //计费方式（重量体积/件数）
                deliveryModeDesc: "",            //收货方式（自提/送货）
                fromCustomerInfo: "",            //发货人[卡XXX编YYY]
                receiptFromCustomerFeeInfo: "",  //收发货人xx元
                receiptToCustomerFeeInfo: "",    //收提货人xx元
                sheetCreateDate: "",             //运单创建日期（字符串）
                effectiveDate: "",               //有效期（字符串）
                transportModeDesc: "",           //运输方式
                paymentMethodDesc: "",           //付款方式
                paymentModeDesc: "",             //支付方式
                consignPrintSummaryInfo: "",     //三方单部分汇总信息
                otherFeeSummaryInfo: "",         //打印大运单时，其他费汇总信息
                primaryFeeSummaryInfo: "",       //打印小运单时，主要费用汇总信息
                secondaryFeeSummaryInfo: "",     //打印小运单时，次要费用汇总信息
                primaryFeeKey: "",               //打印双纸运单时，运费1描述
                primaryFeeValue: "",         //打印双纸运单时，运费1费用
                secondaryFeeKey: "",             //打印双纸运单时，运费2描述
                secondaryFeeValue: "",       //打印双纸运单时，运费2费用
                transportMode: 1,              //运输方式
                paymentMethod: 1,            //付款方式（1-现付，2-提付，3-发货月结，4-收货月结，5-回单付，6-货款扣，7-提付扣，8-现付提付）
                paymentMode: 1,              //支付方式（1-现金，2-pos机，3-支付宝，4-微信）
                isGoodsControl: "",           //要求控货（0-否，1-是）
                nowPayFeeCreditState: "",     //现付赊账状态（0-正常，1-未结清 2-已结清）
                pickPayFeeCreditState: "",    //提付赊账状态（0-正常，1-未结清 2-已结清）
                codCreditState: "",           //代收货款赊账状态（0-正常，1-未结清 2-已结清）
                // settlePayFeeCreditState: "",  //转运垫付状态（0-正常，1-已付 2-未付）
                payOutFeeSettleMode: config['defaultPayOutFeeSettleMode'] == undefined ? 1 : config['defaultPayOutFeeSettleMode'],       //垫付状态 1 现返 2未返
                toOrgAreas: [],
                showCreate: false,
                isChange: false,
                printCount: 0,
                template: defaultTemplate
            }
        }
    };
});