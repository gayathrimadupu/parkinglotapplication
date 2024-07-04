sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, Filter, FilterOperator, JSONModel) {
    "use strict";

    return Controller.extend("com.app.project1.controller.View1", {
        onInit: function () {
            // Load local JSON model for the view
            var oModel = new JSONModel(sap.ui.require.toUrl("com/app/project1/data/model.json"));
            this.getView().setModel(oModel);
        

            // Set a second model (assuming it's defined in the manifest and Component.js)
            var oModelV2 = this.getOwnerComponent().getModel("ModelV2");
            this.getView().byId("pageContainer").setModel(oModelV2);

    // Initialize unassigned data model
var oUnassignedModel = new JSONModel({ unassignedItems: [] });
this.getView().setModel(oUnassignedModel, "unassignedModel");

            if (!this.getView().getModel("tableModel")) {
                var tableModel = new JSONModel();
                this.getView().setModel(tableModel, "tableModel");
            }
        },

        onItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            this.byId("pageContainer").to(this.getView().createId(oItem.getKey()));
        },
        onAssignPress: function () {
            var oView = this.getView();
            var oModel = oView.getModel("tableModel");
        
              // Ensure oModel is not undefined
    if (!oModel) {
        console.error("tableModel not found in the view.");
        return;
    }
        
            // Get values from input fields
            var sDriverName = oView.byId("driverNameInput").getValue().trim();
            var sPhone = oView.byId("driverPhoneInput").getValue().trim();
            var sParkingLot = oView.byId("parkingLotInput").getValue().trim();
            var sDateTime = oView.byId("dateTimePicker").getValue();
            var sVehiclenum = oView.byId("Vehiclenumber").getValue();
        
            console.log("Driver Name:", sDriverName);
            console.log("Phone:", sPhone);
            console.log("Parking Lot:", sParkingLot);
            console.log("Vehiclenum",sVehiclenum)
            console.log("DateTime:", sDateTime);
        
            // Perform basic validation
            if (!sDriverName || !sPhone || !sParkingLot || !sDateTime ||!sVehiclenum ) {
                console.log("Validation failed: Please fill in all required fields.");
                sap.m.MessageToast.show("Please fill in all required fields.");
                return;
            }
        
            // Assuming oModel contains an array of items to which assignments are added
            var oNewAssignment = {
                driverName: sDriverName,
                drivernumber:sPhone,
                vehicalDetails_vehicalNo: sVehiclenum, // Replace with actual vehicle number
                plotNo_plot_NO: sParkingLot,
                assignedDate: sDateTime
            };
        
            // Add the new assignment to the model
            var aItems = oModel.getProperty("/items") || [];
            aItems.push(oNewAssignment);
            oModel.setProperty("/items", aItems);
        
            // Show confirmation message
            sap.m.MessageToast.show("Assignment added successfully");
        
            // Clear input fields after successful assignment
            oView.byId("driverNameInput").setValue("");
            oView.byId("driverPhoneInput").setValue("");
            oView.byId("parkingLotInput").setValue("");
            oView.byId("dateTimePicker").setValue("");
            oView.byId("Vehiclenumber").setValue("");
        },
        onUnassignSinglePress: function (oEvent) {
            var oItem = oEvent.getSource().getParent();
            var oBindingContext = oItem.getBindingContext("tableModel");
            var sPath = oBindingContext.getPath();
            var oModel = this.getView().getModel("tableModel");
        
            var aItems = oModel.getProperty("/items");
            var iIndex = parseInt(sPath.split("/").pop(), 10);
            var oUnassignedItem = aItems.splice(iIndex, 1)[0];
        
            var oUnassignedModel = this.getView().getModel("unassignedModel");
            var aUnassignedItems = oUnassignedModel.getProperty("/unassignedItems");
        
            oUnassignedItem.unassignedDate = new Date().toLocaleString();
            aUnassignedItems.push(oUnassignedItem);
            oUnassignedModel.setProperty("/unassignedItems", aUnassignedItems);
        
            oModel.setProperty("/items", aItems);
            sap.m.MessageToast.show("Assignment removed successfully");
        },
        
        onUnassignSelectedPress: function () {
            var oView = this.getView();
            var oTable = oView.byId("table4");
            var oModel = oView.getModel("tableModel");
            var aItems = oModel.getProperty("/items");
        
            var oUnassignedModel = oView.getModel("unassignedModel");
            var aUnassignedItems = oUnassignedModel.getProperty("/unassignedItems");
        
            var aSelectedItems = oTable.getSelectedItems();
            var aSelectedIndices = aSelectedItems.map(function (oItem) {
                return oTable.indexOfItem(oItem);
            });
        
            aSelectedIndices.sort(function (a, b) { return b - a; });
        
            aSelectedIndices.forEach(function (iIndex) {
                var oUnassignedItem = aItems.splice(iIndex, 1)[0];
                oUnassignedItem.unassignedDate = new Date().toLocaleString();
                aUnassignedItems.push(oUnassignedItem);
            });
        
            oUnassignedModel.setProperty("/unassignedItems", aUnassignedItems);
            oModel.setProperty("/items", aItems);
            oTable.removeSelections(true);
        
            sap.m.MessageToast.show("Selected assignments unassigned successfully");
        }
        
    });
});
