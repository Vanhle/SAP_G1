sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "../model/formatter"
], function (Controller, JSONModel, formatter) {
    "use strict";

    return Controller.extend("overviewdashboard.projectdashboard.controller.EveDetail", {
        formatter: formatter,

        onInit: function () {
            // Khởi tạo model cho filters
            var oFilterModel = new JSONModel({
                severityLevels: [
                    { key: "HIGH", text: "High" },
                    { key: "MEDIUM", text: "Medium" },
                    { key: "LOW", text: "Low" }
                ]
            });
            this.getView().setModel(oFilterModel, "filterModel");
            
            // Load dữ liệu ban đầu
            // this._loadEventData();
        },

        onNavBack: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteOverviewDashboard");
        },

        _loadEventData: function () {
            // Gọi API để lấy dữ liệu chi tiết
            var oDataModel = this.getView().getModel("dataModel");
            // ... xử lý load dữ liệu
        }
    });
}); 