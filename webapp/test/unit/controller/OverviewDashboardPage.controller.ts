/*global QUnit*/
import Controller from "overview_dashboard/projectdashboard/controller/OverviewDashboard.controller";

QUnit.module("OverviewDashboard Controller");

QUnit.test("I should test the OverviewDashboard controller", function (assert: Assert) {
	const oAppController = new Controller("OverviewDashboard");
	oAppController.onInit();
	assert.ok(oAppController);
});