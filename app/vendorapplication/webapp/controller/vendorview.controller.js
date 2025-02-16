sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageBox, MessageToast) {
    "use strict";

    return Controller.extend("com.app.vendorapplication.controller.vendorview", {
        onInit: function () {
            // Get the current date
            var today = new Date();

            // Set the minimum date to tomorrow
            var tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            // Set the minimum date for the date picker
            var oDateTimePicker = this.getView().byId("idinputdatepicker");
            oDateTimePicker.setMinDate(tomorrow);

            // Set display format to show only date
            oDateTimePicker.setDisplayFormat("yyyy-MM-dd");
        },

        onReservePressbtn: async function () {
            debugger
            var oView = this.getView();
            const oModel = oView.byId("idPage").getModel("ModelV2");

            // Get input values
            var svendorname = oView.byId("InputVedorname").getValue();
            var svendorNumber = oView.byId("InputVendornumber").getValue();
            var sVehicleNo = oView.byId("InputVehicleno").getValue();
            var sDriverName = oView.byId("InputDriverName").getValue();
            var sPhoneNo = oView.byId("InputPhonenumber").getValue();
            var sParkingLot = oView.byId("idcombox1").getValue();
            var sVehicleType = oView.byId("InputVehicletype").getSelectedKey();
            var oDatePicker = oView.byId("idinputdatepicker");
            
            var oSelectedDate = oDatePicker.getDateValue();

            // Validation for Phone Number
            if (!sPhoneNo || !sPhoneNo.match(/^[9876]\d{9}$/)) {
                sap.m.MessageBox.error("Please enter a valid phone number starting with 9, 8, 7, or 6 and exactly 10 digits.");
                return;
            }

            // Validation for Vehicle Number
            if (!sVehicleNo || !sVehicleNo.match(/^[\w\d]{1,10}$/)) {
                sap.m.MessageBox.error("Please enter a valid vehicle number (alphanumeric, up to 10 characters).");
                return;
            }
            // Validation for Vehicle Type
    if (sVehicleType !== "inbound" && sVehicleType !== "outbound") {
        sap.m.MessageBox.error("Please select either 'Inbound' or 'Outbound' for vehicle type.");
        return;
    }

            // // Check if Vehicle Number already exists
            // const vehicleExists = await this.checkVehicleExists(oModel, sVehicleNo);
            // if (vehicleExists) {
            //     sap.m.MessageBox.error("Vehicle number already exists. Please enter a different vehicle number.");
            //     return;
            // }

            // Construct payload for reservation entity
            var oPayload = {
                vendorname:svendorname,
                vendorNumber:svendorNumber,
                vehicalNo: sVehicleNo,
                driverName: sDriverName,
                phone: sPhoneNo,
                vehicalType: sVehicleType,
                plotNo_plot_NO: sParkingLot,
                Expectedtime: oSelectedDate // This will store only the date part
            }

            // this.getView().setModel(newmodel, "newmodel");
            // const oPayload = newmodel.getProperty("/");

            // Call OData service to create reservation
            try {
                await this.createData(oModel, oPayload, "/Reservation");

                // Update the status of the parking slot in Page 1
                // await this.updateParkingSlotStatus(oModel, sParkingLot, false);

                // Clear input fields after successful reservation
                sap.m.MessageBox.success("Parking lot reserved successfully");
                setTimeout(() => {
                    oView.byId("InputVedorname").setValue("");
                    oView.byId("InputVendornumber").setValue("");
                    oView.byId("InputVehicleno").setValue("");
                    oView.byId("InputDriverName").setValue("");
                    oView.byId("InputPhonenumber").setValue("");
                    oView.byId("idcombox1").setValue("");
                    oView.byId("InputVehicletype").setSelectedKey("");
                    oView.byId("idinputdatepicker").setValue("");
                }, 1000); // 
               
            } catch (error) {
                sap.m.MessageBox.error("Failed to create reservation. Please try again.");
                console.error("Error creating reservation:", error);
            }
        },
        

        // Function to check if vehicle number exists in backend
        // checkVehicleExists: async function (oModel, sVehicleNo) {
        //     return new Promise((resolve, reject) => {
        //         oModel.read("/VehicalDeatils", {
        //             filters: [
        //                 new sap.ui.model.Filter("vehicalNo", sap.ui.model.FilterOperator.EQ, sVehicleNo)
        //             ],
        //             success: function (oData) {
        //                 resolve(oData.results.length > 0);
        //             },
        //             error: function () {
        //                 reject("An error occurred while checking vehicle number existence.");
        //             }
        //         });
        //     });
        // }

        // Uncomment and add additional functions if needed
    });
});
