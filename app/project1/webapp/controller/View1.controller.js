sap.ui.define([
    "./Basecontroller",
    "sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox",
	
], function (Controller, JSONModel, Device, MessageToast, Fragment, Filter, FilterOperator, MessageBox) {
	"use strict";
    return Controller.extend("com.app.project1.controller.View1", {
        onInit: function () {
            // Load local JSON model for the view
            var oModel = new JSONModel(sap.ui.require.toUrl("com/app/project1/data/model.json"));
            this.getView().setModel(oModel);

			const oLocalModel = new JSONModel({
				VehicalDeatils: {
					vehicalNo: "",
					driverName: "",
					phone: 0,
					vehicalType: "",
					assignedDate: "",
					unassignedDate: "",
					plotNo_plot_NO: "",
				},
				plotNo: {
					available: false
				}
			});
			this.getView().setModel(oLocalModel, "localModel");
			var oModelV2 = this.getOwnerComponent().getModel("ModelV2");
			this.getView().byId("pageContainer").setModel(oModelV2);
			var oViewModel = new JSONModel({
				ImageURL: "https://i.postimg.cc/4s7Np4CT/loading-docks-19268044-transformed-1.jpg"
			});
			this.getView().setModel(oViewModel, "viewModel");
		
			// Optionally log to verify the model and property
			var imageURL = this.getView().getModel("viewModel").getProperty("/ImageURL");
			console.log("Image URL:", imageURL);
		},

		onItemSelect: function (oEvent) {
			var oItem = oEvent.getParameter("item");
			this.byId("pageContainer").to(this.getView().createId(oItem.getKey()));
		},

		onExit: function () {
			Device.media.detachHandler(this._handleMediaChange, this);
		},
		statusTextFormatter: function (bStatus) {
			return bStatus ? "Empty" : "Not Empty"; // Modify as per your requirement
		},

		//
		onValueHelpRequest: function (oEvent) {
			var sInputValue = oEvent.getSource().getValue(),
				oView = this.getView();

			if (!this._pValueHelpDialog) {
				this._pValueHelpDialog = Fragment.load({
					id: oView.getId(),
					name: "com.app.project1.fragment.valuehelp",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog;
				});
			}
			this._pValueHelpDialog.then(function (oDialog) {
				// Create a filter for the binding
				oDialog.setModel(this.getView().getModel("ModelV2"));
				oDialog.getBinding("items").filter([new Filter("plot_NO", FilterOperator.Contains, sInputValue)]);
				// Open ValueHelpDialog filtered by the input's value
				oDialog.open(sInputValue);
			}.bind(this));
		},

		onValueHelpDialogSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("plot_NO", FilterOperator.Contains, sValue);

			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		onValueHelpDialogClose: function (oEvent) {
			var sDescription,
				oSelectedItem = oEvent.getParameter("selectedItem");
			oEvent.getSource().getBinding("items").filter([]);

			if (!oSelectedItem) {
				return;
			}

			sDescription = oSelectedItem.getDescription();

			this.byId("productInput").setSelectedKey(sDescription);
		},

		//Assign the vehicel to the parking lot
		onAssignPress: async function () {
			debugger
			const oPayload = this.getView().byId("page1").getModel("localModel").getProperty("/");
			const { driverName, phone, vehicalNo } = this.getView().byId("page1").getModel("localModel").getProperty("/").VehicalDeatils;
			const vehicalType  = this.getView().byId("idvehiceltype1").getSelectedKey();
			const oModel = this.getView().byId("pageContainer").getModel("ModelV2"); // Assuming "ModelV2" is your ODataModel
			const plotNo = this.getView().byId("productInput").getValue();
			oPayload.VehicalDeatils.plotNo_plot_NO = plotNo;
			oPayload.VehicalDeatils.vehicalType = vehicalType;
			 

			//Assingning the current time to the vehicel data.
			const Intime = new Date;
			oPayload.VehicalDeatils.assignedDate = Intime;


			if (!(driverName && phone && vehicalNo && vehicalType && plotNo)) {
				MessageToast.show("Enter all details")
				return
			}
			// Validate vehicle number format
			if (!vehicalNo.match(/^([A-Z]{2}\s?\d{2}\s?[A-Z]{2}\s?\d{4})$/)) {
				MessageToast.show("Please enter a valid vehicle number format (e.g., AB 12 CD 3456) or (e.g.,AB12CD3456)");
				return;
			}
		
			// Validate driver name format
			if (!driverName.match(/^[a-zA-Z\s]{3,}$/)) {
				MessageToast.show("Please enter a valid driver name (at least 3 letters, no special characters or numbers)");
				return;
			}
		
			// Validate phone number format
			var trimmedPhone = phone.trim();
			var phoneRegex = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[789]\d{9}$/;
			if (!phoneRegex.test(trimmedPhone)) {
				MessageToast.show("Please enter a valid phone number");
				return;
			}
		
			

			var oVehicleExist = await this.checkVehicleNo(oModel, oPayload.VehicalDeatils.vehicalNo)
			if (oVehicleExist) {
				MessageToast.show("Vehicle already exsist")
				return
			};
			const plotAvailability = await this.checkPlotAvailability(oModel, plotNo);
			if (!plotAvailability) {
				sap.m.MessageBox.information(`${plotNo} is not available now.Choose another Parking Lot.`,
					{
						title: "Allocation Information",
						actions: sap.m.MessageBox.Action.OK
					}
				);
				return;
			}

			try {
				// Assuming createData method sends a POST request
				await this.createData(oModel, oPayload.VehicalDeatils, "/VehicalDeatils");
				//await this.createData(oModel, oPayload.VehicalDeatils, "/History");
				sap.m.MessageBox.information(
					`Vehicel No ${vehicalNo} allocated to Slot No ${plotNo}`,
					{
						title: "Allocation Information",
						actions: sap.m.MessageBox.Action.OK
					}
				);
				oModel.update("/PlotNOs('" + plotNo + "')", oPayload.plotNo, {
					success: function () {
						this.getView().byId("page1").getModel("localModel").setProperty("/VehicalDeatils", {
							vehicalNo: "",
							driverName: "",
							phone: "",
							vehicalType: "",
							plotNo_plot_NO: ""
						});
						this.getView().byId("productInput").setValue("");
						this.getView().byId("page1").getModel("localModel").setProperty("/VehicalDeatils/vehicalType", vehicalType);

					}.bind(this),
					error: function (oError) {

						sap.m.MessageBox.error("Failed to update: " + oError.message);
					}.bind(this)
				});

			} catch (error) {
				console.error("Error:", error);
			}
		},
		checkVehicleNo: async function (oModel, sVehicalNo) {
			return new Promise((resolve, reject) => {
				oModel.read("/VehicalDeatils", {
					filters: [
						new Filter("vehicalNo", FilterOperator.EQ, sVehicalNo),

					],
					success: function (oData) {
						resolve(oData.results.length > 0);
					},
					error: function () {
						reject(
							"An error occurred while checking username existence."
						);
					}
				})
			})
		},
		checkPlotAvailability: async function (oModel, plotNo) {
			return new Promise((resolve, reject) => {
				oModel.read("/PlotNOs('" + plotNo + "')", {
					success: function (oData) {
						resolve(oData.available);
					},
					error: function (oError) {
						reject("Error checking plot availability: " + oError.message);
					}
				});
			});
		},
		checkPlotEmpty: async function (oModel, sVehicalNo) {
			return new Promise((resolve, reject) => {
				oModel.read("/VehicalDeatils", {
					filters: [
						new Filter("vehicalNo", FilterOperator.EQ, sVehicalNo),

					],
					success: function (oData) {
						resolve(oData.results.length > 0);
					},
					error: function () {
						reject(
							"An error occurred while checking username existence."
						);
					}
				})
			})
		},

	

onUnassignAllPress: function () {
    var oTable = this.getView().byId("AssignedSlotsTable");
    var aSelectedItems = oTable.getSelectedItems();

    // Check if at least two items are selected
    if (aSelectedItems.length < 2) {
        MessageBox.error("Please select at least two rows to unassign");
        return;
    }

    var oModel = this.getOwnerComponent().getModel("ModelV2");

    // Iterate through selected items to unassign each
    for (var i = 0; i < aSelectedItems.length; i++) {
        var oSelectedItem = aSelectedItems[i];
        var oBindingContext = oSelectedItem.getBindingContext();
        var sPath = oBindingContext.getPath();
        var oSlot = oBindingContext.getObject();

        try {
            // Move to History
            this.moveToHistory(oModel, oSlot);

            // Delete from VehicalDeatils
            this.deleteFromVehicalDetails(oModel, sPath);

            // Update PlotNOs availability to 'empty'
            this.updatePlotAvailability(oModel, oSlot.plotNo_plot_NO);
        } catch (error) {
            MessageBox.error("Failed to unassign slots: " + error.message);
            return;
        }
    }

    MessageBox.success("Selected slots unassigned successfully");
},
onUnassignPress: function () {
    var oTable = this.getView().byId("AssignedSlotsTable");
    var aSelectedItems = oTable.getSelectedItems();

    // Check if multiple items are selected
    if (aSelectedItems.length !== 1) {
        MessageBox.error("Please select exactly one row to unassign");
        return;
    }

    var oModel = this.getOwnerComponent().getModel("ModelV2");

    // Get the selected item
    var oSelectedItem = aSelectedItems[0];
    var oBindingContext = oSelectedItem.getBindingContext();
    var sPath = oBindingContext.getPath();
    var oSlot = oBindingContext.getObject();

    try {
        // Move to History
        this.moveToHistory(oModel, oSlot);

        // Delete from VehicalDeatils
        this.deleteFromVehicalDetails(oModel, sPath);

        // Update PlotNOs availability to 'empty'
        this.updatePlotAvailability(oModel, oSlot.plotNo_plot_NO);
    } catch (error) {
        MessageBox.error("Failed to unassign slot: " + error.message);
        return;
    }

    MessageBox.success("Slot unassigned successfully");
},

moveToHistory: function (oModel, oSlot) {
    var oHistory = {
        vehicalNo: oSlot.vehicalNo,
        driverName: oSlot.driverName,
        phone: oSlot.phone,
        vehicalType: oSlot.vehicalType,
        assignedDate: oSlot.assignedDate,
        unassignedDate: new Date(),
        plotNo: oSlot.plotNo_plot_NO
    };

    this.createData(oModel, oHistory, "/History");
},

deleteFromVehicalDetails: function (oModel, sPath) {
    oModel.remove(sPath);
},

createData: function (oModel, oData, sEntitySet) {
    oModel.create(sEntitySet, oData, {
        success: function () {
            // Optional success handling
        },
        error: function (oError) {
            MessageBox.error("Error creating history entry: " + oError.message);
        }
    });
},

updatePlotAvailability: function (oModel, plotNo) {
    // Update PlotNOs availability to 'empty'
    var oPayload = {
        available: true // Change 'true' to whatever indicates 'empty' in your data model
    };

    oModel.update("/PlotNOs('" + plotNo + "')", oPayload, {
        success: function () {
            // Optional success handling
        },
        error: function (oError) {
            MessageBox.error("Failed to update plot availability: " + oError.message);
        }
    });
},
onUpdateSlotPress: function() {
    var oTable = this.getView().byId("AssignedSlotsTable");
    var aSelectedItems = oTable.getSelectedItems();

    // Check if exactly one item is selected
    if (aSelectedItems.length === 1) {
        var oSelectedItem = aSelectedItems[0];
        var oContext = oSelectedItem.getBindingContext();
        var oSelectedObject = oContext.getObject();

        // Load fragment
        this.loadFragment(oSelectedObject);
    } else {
        MessageBox.error("Please select exactly one row to update");
    }
},

loadFragment: function(oSelectedObject) {
	debugger
    // Load fragment
    Fragment.load({
        id: this.getView().getId(),
        name: "com.app.project1.fragment.UpdateSlotDialog",
        controller: this
    }).then(function(oFragment) {
        // Set data to fragment model
        var oFragmentModel = new JSONModel(oSelectedObject);
        this.getView().setModel(oFragmentModel, "localModel");

        // Open fragment as dialog
        this.getView().addDependent(oFragment);
        oFragment.open();
    }.bind(this));
},

onUpdateDialogSave: function() {
	debugger
    var oModel = this.getOwnerComponent().getModel("ModelV2");
    var oLocalModel = this.getView().getModel("localModel");
    var oPayload = oLocalModel.getData(),
	oSelected = this.getView().byId("AssignedSlotsTable").getSelectedItem().getBindingContext().getObject(),
	oOldSlot = oSelected.plotNo_plot_NO
    // Perform validation or additional logic if needed

    // Update the selected row with updated plot number
    oModel.update("/VehicalDeatils('" + oPayload.vehicalNo + "')", oPayload, {
        success: function() {
            // Update the old plot number to "Available"
            oModel.update("/PlotNOs('" + oOldSlot + "')", {
                available: true
            });

            // Update the new plot number to "Unavailable"
            oModel.update("/PlotNOs('" + oPayload.plotNo_plot_NO + "')", {
                available: false
            });

            MessageBox.success("Slot updated successfully");

            // Update the table binding to reflect changes
            var oTable = this.getView().byId("AssignedSlotsTable");
            oTable.getBinding("items").refresh();

            // Refresh page1 to reflect status changes
            var oPage1 = this.getView().byId("page1"); // Replace with your actual ID
            // Refresh page1 content or update necessary properties
            // Example: oPage1.refresh(); or oPage1.setProperty("/status", updatedStatus);

            // Close dialog on success
            this.getView().byId("updateDialog").close();
        }.bind(this),
        error: function(oError) {
            MessageBox.error("Failed to update slot: " + oError.message);
        }
    });
},
onUpdateDialogCancel: function() {
    // Close dialog on cancel
    this.getView().byId("updateDialog").close();
},

onSuggestionItemSelected: function(oEvent) {
    // Handle suggestion item selection for plot number
    var oSelectedItem = oEvent.getParameter("selectedItem");
    var sPlotNo = oSelectedItem.getText(); // Assuming text is the plot number

    // Update local model with selected plot number
    var oLocalModel = this.getView().getModel("localModel");
    oLocalModel.setProperty("/plotNo_plot_NO", sPlotNo);
}

});
});