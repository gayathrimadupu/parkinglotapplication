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

// Initialize unassignedModel
var unassignedModel = new JSONModel({ unassignedItems: [] });
this.getView().setModel(unassignedModel, "unassignedModel");

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
        
            // Fetch input fields
            var oDriverNameInput = oView.byId("driverNameInput");
            var oDriverPhoneInput = oView.byId("driverPhoneInput");
            var oVehicleNumberInput = oView.byId("Vehiclenumber");
            var oParkingLotSelect = oView.byId("parkingLotSelect");
            var oDateTimePicker = oView.byId("dateTimePicker");
            var oInOutRadioGroup = oView.byId("inOutRadioGroup");
        
            // Debug logs to check if inputs are found
            console.log("Driver Name Input:", oDriverNameInput);
            console.log("Driver Phone Input:", oDriverPhoneInput);
            console.log("Vehicle Number Input:", oVehicleNumberInput);
            console.log("Parking Lot Select:", oParkingLotSelect);
            console.log("Date Time Picker:", oDateTimePicker);
            console.log("In/Out Radio Group:", oInOutRadioGroup);
        
            // Check if any input field is not found
            if (!oDriverNameInput || !oDriverPhoneInput || !oVehicleNumberInput || !oParkingLotSelect || !oDateTimePicker || !oInOutRadioGroup) {
                console.error("One or more input fields not found in the view.");
                return;
            }
        
            // Get values from input fields
            var sDriverName = oDriverNameInput.getValue().trim();
            var sPhone = oDriverPhoneInput.getValue().trim();
            var sVehicleNumber = oVehicleNumberInput.getValue().trim();
            var sParkingLot = oParkingLotSelect.getSelectedKey(); // Assuming selectedKey is used for plot_NO
            var sDateTime = oDateTimePicker.getValue();
            var sInOut = oInOutRadioGroup.getSelectedButton().getText(); // Assuming getText() retrieves selected radio button text
        
            console.log("Driver Name:", sDriverName);
            console.log("Phone:", sPhone);
            console.log("Vehicle Number:", sVehicleNumber);
            console.log("Parking Lot:", sParkingLot);
            console.log("Date Time:", sDateTime);
            console.log("In/Out:", sInOut);
        
            // Perform basic validation
            if (!sDriverName || !sPhone || !sVehicleNumber || !sParkingLot || !sDateTime || !sInOut) {
                console.log("Validation failed: Please fill in all required fields.");
                sap.m.MessageToast.show("Please fill in all required fields.");
                return;
            }
        
            // Assuming oModel contains an array of items to which assignments are added
            var oModel = oView.getModel("tableModel");
            if (!oModel) {
                console.error("tableModel not found in the view.");
                return;
            }
        
            // Create new assignment object
            var oNewAssignment = {
                driverName: sDriverName,
                drivernumber: sPhone,
                vehicalDetails_vehicalNo: sVehicleNumber, // Replace with actual vehicle number
                plotNo_plot_NO: sParkingLot,
                assignedDate: sDateTime,
                inwardOrOutward: sInOut
            };
        
            // Add the new assignment to the model
            var aItems = oModel.getProperty("/items") || [];
            aItems.push(oNewAssignment);
            oModel.setProperty("/items", aItems);
        
            // Show confirmation message
            sap.m.MessageToast.show("Assignment added successfully");
        
            // Clear input fields after successful assignment
            oDriverNameInput.setValue("");
            oDriverPhoneInput.setValue("");
            oVehicleNumberInput.setValue("");
            oParkingLotSelect.setSelectedKey(""); // Clear selection
            oDateTimePicker.setValue("");
            oInOutRadioGroup.setSelectedIndex(-1); // Clear selection
        },
        onUnassignSinglePress: function (oEvent) {
            var oItem = oEvent.getSource().getParent();
            var oBindingContext = oItem.getBindingContext("tableModel");
            var sPath = oBindingContext.getPath();
            var oModel = this.getView().getModel("tableModel");

            // Remove the item from tableModel
            var aItems = oModel.getProperty("/items");
            var iIndex = parseInt(sPath.split("/").pop(), 10);
            // aItems.splice(iIndex, 1);
            // oModel.setProperty("/items", aItems);

            // // Update unassignedModel
            // var unassignedItems = this._getUnassignedItems(aItems); // Assuming a function to filter unassigned items
            // var unassignedModel = this.getView().getModel("unassignedModel");
            // unassignedModel.setProperty("/unassignedItems", unassignedItems);

            // // Show confirmation message
            // MessageToast.show("Assignment removed successfully");
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

            // Remove selected items from tableModel
        //     var aSelectedItems = oTable.getSelectedItems();
        //     var aSelectedIndices = aSelectedItems.map(function (oItem) {
        //         return oTable.indexOfItem(oItem);
        //     });

        //     aSelectedIndices.sort(function (a, b) { return b - a; });

        //     aSelectedIndices.forEach(function (iIndex) {
        //         aItems.splice(iIndex, 1);
        //     });

        //     oModel.setProperty("/items", aItems);
        //     oTable.removeSelections(true);

        //     // Update unassignedModel
        //     var unassignedItems = this._getUnassignedItems(aItems); // Assuming a function to filter unassigned items
        //     var unassignedModel = this.getView().getModel("unassignedModel");
        //     unassignedModel.setProperty("/unassignedItems", unassignedItems);

        //     // Show confirmation message
        //     MessageToast.show("Selected assignments unassigned successfully");
        // },

        // _getUnassignedItems: function (items) {
        //     // Implement logic to filter items for unassignedModel
        //     // Example: Return items where assignedDate is empty or unassignedDate is not empty
        //     return items.filter(function (item) {
        //         return !item.assignedDate || item.unassignedDate;
        //     });
        // }
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