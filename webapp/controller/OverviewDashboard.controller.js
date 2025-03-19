sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/json/JSONModel",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/api/env/Format",
    "sap/ui/model/BindingMode",
    "sap/m/DateRangeSelection",
    "sap/m/Popover",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/m/MultiComboBox",
    "sap/ui/core/Item"
], function (Controller, ODataModel, JSONModel, BindingMode, FlattenedDataset, ChartFormatter, Format, DateRangeSelection, Popover, Text, VBox, MultiComboBox, Item) {
    "use strict";

    return Controller.extend("overviewdashboard.projectdashboard.controller.OverviewDashboard", {
        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when controller is instantiated
         * @public
         */
        onInit: function () {
            // Thêm viewModel để quản lý trạng thái busy
            var oViewModel = new JSONModel({
                busy: false,
                pieBusy: false
            });
            this.getView().setModel(oViewModel, "viewModel");

            // Khởi tạo OData Model
            var oDataModel = new ODataModel("/sap/opu/odata/sap/ZL253_TEST_SM20_SEGW_SRV/");
            this.getView().setModel(oDataModel, "dataModel");

            // Gọi API để cập nhật dữ liệu mới nhất
            this._triggerDataUpdate(oDataModel);

            // Khởi tạo giá trị mặc định cho DateRangeSelection
            this._initializeDateRange();

            // Thêm LogType Model và khởi tạo filter
            const oLogTypeModel = new JSONModel();
            oLogTypeModel.loadData("../model/logType.json", null, false); // Thêm tham số false để load đồng bộ
            this.getView().setModel(oLogTypeModel, "logTypeModel");
            
            // Khởi tạo filter cho Log Type
            this._initializeLogTypeFilter();
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Xử lý sự kiện khi thay đổi khoảng thời gian
         * @param {sap.ui.base.Event} oEvent Event object
         * @public
         */
        onDateRangeChange: function (oEvent) {
            var oDateRange = oEvent.getSource();
            var oStartDate = oDateRange.getDateValue();
            var oEndDate = oDateRange.getSecondDateValue();

            if (oStartDate && oEndDate) {
                var startDateTime = this._formatDateToDateTime(oStartDate, true);
                var endDateTime = this._formatDateToDateTime(oEndDate, false);
                this._loadChartDataWithParams(startDateTime, endDateTime);
            }
        },

        /**
         * Xử lý sự kiện khi thay đổi Step
         * @param {sap.ui.base.Event} oEvent Event object
         * @public
         */
        onStepChange: function (oEvent) {
            var sSelectedStep = oEvent.getParameter("selectedItem").getKey();
            var oDateRange = this.byId("dateRangeSelection");
            var oStartDate = oDateRange.getDateValue();
            var oEndDate = oDateRange.getSecondDateValue();

            if (oStartDate && oEndDate) {
                var startDateTime = this._formatDateToDateTime(oStartDate, true);
                var endDateTime = this._formatDateToDateTime(oEndDate, false);
                this._loadChartDataWithParams(startDateTime, endDateTime, sSelectedStep);
            }
        },

        /**
         * Xử lý sự kiện khi nhấn nút Refresh
         * @public
         */
        onRefreshPress: function () {
            // Reset DateRangeSelection và Step
            this._resetToDefaultState();
            
            // Load lại dữ liệu cho biểu đồ Event by Day
            this._loadEventByDayChart();
        },

        /**
         * Điều hướng đến trang chi tiết
         * @public
         */
        onViewDetail: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("EveDetail");
        },

        /**
         * Xử lý sự kiện khi click vào bar chart
         * @param {sap.ui.base.Event} oEvent Event object
         * @public
         */
        onVizFrameSelectData: function(oEvent) {
            const oPoint = oEvent.getParameter("data")[0];
            if (!oPoint) {
                return;
            }

            // Lấy Type từ điểm được chọn
            const sSelectedType = oPoint.data["Log Type"];
            
            // Tìm description tương ứng từ logType model
            const aLogTypes = this.getView().getModel("logTypeModel").getData();
            const oLogType = aLogTypes.find(item => item.code === sSelectedType);
            
            // Nếu không tìm thấy description, log ra console
            if (!oLogType) {
                console.log("Missing description for Log Type:", sSelectedType);
                // Hiển thị popover với thông báo không có description
                this._showPopover({
                    code: sSelectedType,
                    description: "No description available"
                });
                return;
            }

            // Hiển thị popover với thông tin đầy đủ
            this._showPopover({
                code: sSelectedType,
                description: oLogType.description
            });
        },

        /**
         * Hiển thị popover với thông tin được cung cấp
         * @param {Object} oData Dữ liệu để hiển thị (code và description)
         * @private
         */
        _showPopover: function(oData) {
            // Tạo popover nếu chưa tồn tại
            if (!this._oPopover) {
                this._oPopover = new sap.m.Popover({
                    title: "Log Type Details",
                    contentWidth: "300px",
                    content: new sap.m.VBox({
                        items: [
                            new sap.m.Text({
                                text: "Code: {popoverModel>/code}"
                            }).addStyleClass("sapUiSmallMarginBegin sapUiSmallMarginTop"),
                            new sap.m.Text({
                                text: "Description: {popoverModel>/description}"
                            }).addStyleClass("sapUiSmallMargin")
                        ]
                    }),
                    placement: sap.m.PlacementType.Auto
                });
                this.getView().addDependent(this._oPopover);
            }

            // Set data cho popover
            const oPopoverModel = new JSONModel(oData);
            this._oPopover.setModel(oPopoverModel, "popoverModel");

            // Hiển thị popover tại vị trí click
            const oVizFrame = this.byId("idVizFramePie");
            this._oPopover.openBy(oVizFrame.getDomRef());
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Khởi tạo giá trị mặc định cho DateRangeSelection
         * @private
         */
        _initializeDateRange: function () {
            var oDateRange = this.byId("dateRangeSelection");
            var oEndDate = new Date();
            var oStartDate = new Date();
            oStartDate.setDate(oStartDate.getDate() - 7);
            oDateRange.setDateValue(oStartDate);
            oDateRange.setSecondDateValue(oEndDate);
        },

        /**
         * Reset về trạng thái mặc định cho biểu đồ Event by Day
         * @private
         */
        _resetToDefaultState: function () {
            // Reset DateRangeSelection
            var oDateRange = this.byId("dateRangeSelection");
            var oEndDate = new Date();
            var oStartDate = new Date();
            oStartDate.setDate(oStartDate.getDate() - 7);
            oDateRange.setDateValue(oStartDate);
            oDateRange.setSecondDateValue(oEndDate);

            // Reset Step về 1d
            var oStepSelect = this.byId("stepSelect");
            oStepSelect.setSelectedKey("1d");
        },

        /**
         * Trigger cập nhật dữ liệu mới
         * @param {sap.ui.model.odata.v2.ODataModel} oDataModel OData model
         * @private
         */
        _triggerDataUpdate: function (oDataModel) {
            oDataModel.callFunction("/TriggerZG1SALV", {
                method: "POST",
                success: function () {
                    this.loadChartData(oDataModel);
                    console.log("Trigger ZG1SALV success");
                }.bind(this),
                error: function (oError) {
                    console.error("Error triggering ZG1SALV", oError);
                    this.loadChartData(oDataModel);
                    console.log("Trigger ZG1SALV error");
                }.bind(this)
            });
        },

        /**
         * Load dữ liệu cho biểu đồ với các tham số
         * @param {string} startDateTime Thời gian bắt đầu
         * @param {string} endDateTime Thời gian kết thúc
         * @param {string} [step] Step (mặc định là 1d)
         * @private
         */
        _loadChartDataWithParams: function (startDateTime, endDateTime, step) {
            // Set busy state
            this.getView().getModel("viewModel").setProperty("/busy", true);

            var oDataModel = this.getView().getModel("dataModel");
            step = step || this.byId("stepSelect").getSelectedKey() || "1d";

            oDataModel.read("/SalogCountSet", {
                urlParameters: {
                    "$filter": "StartDateTime eq datetime'" + startDateTime +
                        "' and EndDateTime eq datetime'" + endDateTime +
                        "' and Step eq '" + step + "'",
                    "$format": "json"
                },
                success: function(oData) {
                    this._onDataLoadSuccess(oData);
                    // Reset busy state
                    this.getView().getModel("viewModel").setProperty("/busy", false);
                }.bind(this),
                error: function(oError) {
                    this._onDataLoadError(oError);
                    // Reset busy state on error
                    this.getView().getModel("viewModel").setProperty("/busy", false);
                }.bind(this)
            });
        },

        /**
         * Xử lý khi load dữ liệu thành công
         * @param {Object} oData Dữ liệu trả về từ server
         * @private
         */
        _onDataLoadSuccess: function (oData) {
            var formattedData = oData.results.map(function (item) {
                return {
                    ...item,
                    StartDateTime: new Date(item.StartDateTime).toISOString().split('T')[0],
                    MediumCount: item.MediumCount,
                    HighCount: item.HighCount
                };
            });

            var oModel = new JSONModel({
                results: formattedData
            });
            this.getView().setModel(oModel, "processedDataModel");
        },

        /**
         * Xử lý khi load dữ liệu thất bại
         * @param {Object} oError Đối tượng lỗi
         * @private
         */
        _onDataLoadError: function (oError) {
            console.error("Error fetching data from OData service", oError);
        },

        /**
         * Format date thành datetime string
         * @param {Date} date Đối tượng Date cần format
         * @param {boolean} isStartDate True nếu là ngày bắt đầu (00:00:00), false nếu là ngày kết thúc (17:00:00)
         * @returns {string} Datetime string đã format
         * @private
         */
        _formatDateToDateTime: function (date, isStartDate) {
            var year = date.getFullYear();
            var month = String(date.getMonth() + 1).padStart(2, '0');
            var day = String(date.getDate()).padStart(2, '0');
            var time = isStartDate ? "00:00:00" : "17:00:00";

            return `${year}-${month}-${day}T${time}`;
        },

        /**
         * Lấy thời gian hiện tại
         * @returns {string} Thời gian hiện tại format HH:mm:ss
         * @private
         */
        _getCurrentTime: function () {
            var now = new Date();
            var hours = String(now.getHours()).padStart(2, '0');
            var minutes = String(now.getMinutes()).padStart(2, '0');
            var seconds = String(now.getSeconds()).padStart(2, '0');
            return hours + ':' + minutes + ':' + seconds;
        },

        // Tách phần load dữ liệu biểu đồ ra thành hàm riêng
        getCurrentDateTime: function () {
            var currentDate = new Date();
            var year = currentDate.getFullYear();
            var month = String(currentDate.getMonth() + 1).padStart(2, '0');
            var day = String(currentDate.getDate()).padStart(2, '0');
            // var hours = String(currentDate.getHours()).padStart(2, '0');
            // var minutes = String(currentDate.getMinutes()).padStart(2, '0');
            // var seconds = String(currentDate.getSeconds()).padStart(2, '0');

            return `${year}-${month}-${day}T17:00:00`;
        },

        getStartDateTime: function () {
            var startDate = new Date();
            startDate.setDate(startDate.getDate() - 7); // Trừ đi 7 ngày
            // startDate.setHours(0, 0, 0, 0); // Set giờ về 00:00:00

            // Tạo string datetime với offset +07:00
            var year = startDate.getFullYear();
            var month = String(startDate.getMonth() + 1).padStart(2, '0');
            var day = String(startDate.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}T00:00:00`;
        },

        /**
         * Load dữ liệu cho tất cả các biểu đồ
         * @param {sap.ui.model.odata.v2.ODataModel} oDataModel OData model
         * @public
         */
        loadChartData: function (oDataModel) {
            // Load dữ liệu cho Event by Day chart
            this._loadEventByDayChart();
            
            // Load dữ liệu cho Log Type chart
            this._loadLogTypeData(oDataModel);

            // Tạo mô hình JSON và tải dữ liệu cho biểu đồ thời gian
            var oEventTimeModel = new JSONModel();
            oEventTimeModel.loadData("../model/eventTimeData.json");
            this.getView().setModel(oEventTimeModel, "eventTimeModel");

            // Cập nhật properties cho các biểu đồ
            this._updateChartProperties();
        },

        /**
         * Load dữ liệu cho biểu đồ Log Type
         * @param {sap.ui.model.odata.v2.ODataModel} oDataModel OData model
         * @private
         */
        _loadLogTypeData: function(oDataModel) {
            // Set busy state
            this.getView().getModel("viewModel").setProperty("/pieBusy", true);

            oDataModel.read("/SalogTypeCountSet", {
                urlParameters: {                   
                    "$format": "json"
                },
                success: function(oData) {
                    // Format dữ liệu trả về
                    var formattedData = {
                        logData: oData.results.map(function(item) {
                            return {
                                logType: item.Type,
                                count: parseInt(item.Count)
                            };
                        })
                    };

                    // Tạo JSON Model mới với dữ liệu đã format
                    var oLogModel = new JSONModel(formattedData);
                    this.getView().setModel(oLogModel, "logDataModel");


                    // Reset busy state
                    this.getView().getModel("viewModel").setProperty("/pieBusy", false);
                }.bind(this),
                error: function(oError) {
                    console.error("Error loading Log Type data:", oError);
                    this.getView().getModel("viewModel").setProperty("/pieBusy", false);
                }.bind(this)
            });
        },

        /**
         * Cập nhật properties cho các biểu đồ
         * @private
         */
        _updateChartProperties: function() {
            // Set title for the column chart
            var oVizFrameColumn = this.byId("idVizFrameColumn");
            oVizFrameColumn.setVizProperties({
                title: {
                    text: "Events by Day"
                },
                    dataLabel: {
                        visible: true,
                        position: "outside"
                },
                valueAxis: {
                    title: {
                        visible: false
                    }
                },
                categoryAxis: {
                    title: {
                        visible: false
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

        /**
         * Load dữ liệu cho biểu đồ Event by Day
         * @private
         */
        _loadEventByDayChart: function() {
            // Set busy state chỉ cho biểu đồ column
            this.getView().getModel("viewModel").setProperty("/busy", true);
            
            var endDateTime = this.getCurrentDateTime();
            var startDateTime = this.getStartDateTime();
            
            var oDataModel = this.getView().getModel("dataModel");
            oDataModel.read("/SalogCountSet", {
                urlParameters: {
                    "$filter": "StartDateTime eq datetime'" + startDateTime +
                        "' and EndDateTime eq datetime'" + endDateTime +
                        "' and Step eq '1d'",
                    "$format": "json"
                },
                success: function(oData) {
                    // Format dữ liệu
                    var formattedData = oData.results.map(function (item) {
                        return {
                            ...item,
                            StartDateTime: new Date(item.StartDateTime).toISOString().split('T')[0],
                            MediumCount: item.MediumCount,
                            HighCount: item.HighCount
                        };
                    });

                    // Cập nhật model
                    var oModel = new JSONModel({
                        results: formattedData
                    });
                    this.getView().setModel(oModel, "processedDataModel");

                    // Cập nhật thời gian
                    var oTimeModel = new JSONModel({
                        currentTime: this._getCurrentTime()
                    });
                    this.getView().setModel(oTimeModel, "timeModel");

                    // Reset busy state
                    this.getView().getModel("viewModel").setProperty("/busy", false);
                }.bind(this),
                error: function(oError) {
                    console.error("Error loading Event by Day data:", oError);
                    // Reset busy state on error
                    this.getView().getModel("viewModel").setProperty("/busy", false);
                }.bind(this)
            });
        },

        /**
         * Khởi tạo filter cho Log Type
         * @private
         */
        _initializeLogTypeFilter: function() {
            const oMultiComboBox = this.byId("logTypeFilter");
            const oLogTypeModel = this.getView().getModel("logTypeModel");
            const aLogTypes = oLogTypeModel.getData() || [];
            
            // Thêm option "All"
            const aItems = [
                new Item({
                    key: "ALL",
                    text: "All"
                })
            ];

            // Thêm các log type từ JSON
            if (Array.isArray(aLogTypes)) {
                aLogTypes.forEach(logType => {
                    aItems.push(new Item({
                        key: logType.code,
                        text: `${logType.code} - ${logType.description}`
                    }));
                });
            }

            oMultiComboBox.removeAllItems(); // Xóa items cũ nếu có
            aItems.forEach(item => {
                oMultiComboBox.addItem(item);  // Sử dụng addItem thay vì addItems
            });
            
            // Mặc định chọn "All"
            oMultiComboBox.setSelectedKeys(["ALL"]);
            this._disableOtherSelections(true);
        },

        /**
         * Xử lý sự kiện khi thay đổi lựa chọn trong filter
         * @param {sap.ui.base.Event} oEvent Event object
         */
        onLogTypeFilterChange: function(oEvent) {
            const oMultiComboBox = oEvent.getSource();
            const aSelectedKeys = oMultiComboBox.getSelectedKeys();
            
            // Kiểm tra nếu "All" được chọn
            if (aSelectedKeys.includes("ALL")) {
                // Nếu có các lựa chọn khác cùng với "All", chỉ giữ lại "All"
                if (aSelectedKeys.length > 1) {
                    oMultiComboBox.setSelectedKeys(["ALL"]);
                }
                this._disableOtherSelections(true);
            } else {
                this._disableOtherSelections(false);
            }

            // Cập nhật dữ liệu biểu đồ
            this._updateLogTypeChart(aSelectedKeys);
        },

        /**
         * Xử lý sự kiện khi hoàn thành việc chọn trong filter
         */
        onLogTypeFilterFinish: function() {
            const oMultiComboBox = this.byId("logTypeFilter");
            const aSelectedKeys = oMultiComboBox.getSelectedKeys();
            
            // Nếu không có lựa chọn nào, tự động chọn "All"
            if (aSelectedKeys.length === 0) {
                oMultiComboBox.setSelectedKeys(["ALL"]);
                this._disableOtherSelections(true);
            }
        },

        /**
         * Xử lý sự kiện khi nhấn nút reset filter
         */
        onResetLogTypeFilter: function() {
            const oMultiComboBox = this.byId("logTypeFilter");
            oMultiComboBox.setSelectedKeys(["ALL"]);
            this._disableOtherSelections(true);
            
            // Load lại toàn bộ dữ liệu
            this._loadLogTypeData(this.getView().getModel("dataModel"));
        },

        /**
         * Vô hiệu hóa các lựa chọn khác khi "All" được chọn
         * @param {boolean} bDisable True để vô hiệu hóa, false để kích hoạt
         * @private
         */
        _disableOtherSelections: function(bDisable) {
            const oMultiComboBox = this.byId("logTypeFilter");
            const aItems = oMultiComboBox.getItems();
            
            aItems.forEach(item => {
                if (item.getKey() !== "ALL") {
                    item.setEnabled(!bDisable);
                }
            });
        },

        /**
         * Cập nhật dữ liệu biểu đồ dựa trên các lựa chọn filter
         * @param {string[]} aSelectedKeys Mảng các key được chọn
         * @private
         */
        _updateLogTypeChart: function(aSelectedKeys) {
            const oDataModel = this.getView().getModel("dataModel");
            
            // Nếu "All" được chọn hoặc không có lựa chọn nào
            if (aSelectedKeys.includes("ALL") || aSelectedKeys.length === 0) {
                this._loadLogTypeData(oDataModel);
                return;
            }

            // Set busy state
            this.getView().getModel("viewModel").setProperty("/pieBusy", true);

            oDataModel.read("/SalogTypeCountSet", {
                urlParameters: {
                    "$format": "json"
                },
                success: function(oData) {
                    // Lọc dữ liệu theo các type được chọn
                    const filteredResults = oData.results.filter(item => 
                        aSelectedKeys.includes(item.Type)
                    );

                    // Format dữ liệu đã lọc
                    const formattedData = {
                        logData: filteredResults.map(item => ({
                            logType: item.Type,
                            count: parseInt(item.Count)
                        }))
                    };

                    // Cập nhật model
                    const oLogModel = new JSONModel(formattedData);
                    this.getView().setModel(oLogModel, "logDataModel");



                    // Reset busy state
                    this.getView().getModel("viewModel").setProperty("/pieBusy", false);
                }.bind(this),
                error: function(oError) {
                    console.error("Error loading Log Type data:", oError);
                    this.getView().getModel("viewModel").setProperty("/pieBusy", false);
                }.bind(this)
            });
        },


    });
}); 