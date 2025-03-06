sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("overviewdashboard.projectdashboard.controller.EveDetail", {
        onInit: function () {
            // Initialization code here
        },

        // Nav to Event Detail Page
        onHomePress: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteOverviewDashboard");
        }
    });
}); 