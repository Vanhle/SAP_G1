sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/api/env/Format",
    "sap/ui/model/BindingMode"

], function (Controller, JSONModel, BindingMode, FlattenedDataset, ChartFormatter, Format) {
    "use strict";

    return Controller.extend("overviewdashboard.projectdashboard.controller.OverviewDashboard", {
        onInit: function () {
            // Tạo mô hình JSON và tải dữ liệu cho biểu đồ cột
            var oModel = new JSONModel();
            oModel.loadData("../model/data.json");
            this.getView().setModel(oModel, "dataModel");

            // Tạo mô hình JSON và tải dữ liệu cho biểu đồ tròn
            var oLogModel = new JSONModel();
            oLogModel.loadData("../model/logData.json");
            this.getView().setModel(oLogModel, "logDataModel");

            // Tạo mô hình JSON và tải dữ liệu cho biểu đồ severity
            var oSeverityModel = new JSONModel();
            oSeverityModel.loadData("../model/severityLog.json");
            this.getView().setModel(oSeverityModel, "severityModel");

            // Tạo mô hình JSON và tải dữ liệu cho biểu đồ thời gian
            var oEventTimeModel = new JSONModel();
            oEventTimeModel.loadData("../model/eventTimeData.json");
            this.getView().setModel(oEventTimeModel, "eventTimeModel");

            // Tạo mô hình JSON cho thời gian hiện tại
            var oTimeModel = new JSONModel({
                currentTime: this.getCurrentTime()
            });
            this.getView().setModel(oTimeModel, "timeModel");

            // Set title for the column chart
            var oVizFrameColumn = this.byId("idVizFrameColumn");
            oVizFrameColumn.setVizProperties({
                title: {
                    text: "Events by Day"
                },
                plotArea: {
                    dataLabel: {
                        visible: true,
                        position: "outside"
                    }
                }
            });

            // Set title for the pie chart
            var oVizFramePie = this.byId("idVizFramePie");
            oVizFramePie.setVizProperties({
                title: {
                    text: "Log Type"
                },
                plotArea: {
                    dataLabel: {
                        visible: true,
                        position: "outside"
                    }
                }
            });

            // Set title for the severity chart
            var oVizFrameHorizontal = this.byId("idVizFrameHorizontal");
            oVizFrameHorizontal.setVizProperties({
                title: {
                    text: "Severity Levels"
                },
                plotArea: {
                    dataLabel: {
                        visible: true,
                        position: "outside"
                    }
                }
            });

            // Set title for the event time chart
            var oEventTimeVizFrame = this.byId("eventTimeVizFrame");
            oEventTimeVizFrame.setVizProperties({
                title: {
                    text: "Event by Time"
                },
                plotArea: {
                    dataLabel: {
                        visible: true,
                        position: "outside"
                    }
                }
            });
        },
        // Nav to Event Detail Page
        onViewDetail: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("EveDetail");
        },
        getCurrentTime: function() {
            var now = new Date();
            var hours = String(now.getHours()).padStart(2, '0');
            var minutes = String(now.getMinutes()).padStart(2, '0');
            var seconds = String(now.getSeconds()).padStart(2, '0');
            return hours + ':' + minutes + ':' + seconds;
        }
    });
}); 