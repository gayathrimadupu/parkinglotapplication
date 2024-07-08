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
			const oPayload = this.getView().byId("page1").getModel("localModel").getProperty("/");
			const { driverName, phone, vehicalNo, vehicalType } = this.getView().byId("page1").getModel("localModel").getProperty("/").VehicalDeatils;
			const oModel = this.getView().byId("pageContainer").getModel("ModelV2"); // Assuming "ModelV2" is your ODataModel
			const plotNo = this.getView().byId("productInput").getValue();
			oPayload.VehicalDeatils.plotNo_plot_NO = plotNo;
			 

			//Assingning the current time to the vehicel data.
			const Intime = new Date;
			oPayload.VehicalDeatils.assignedDate = Intime;


			if (!(driverName && phone && vehicalNo && vehicalType && plotNo)) {
				MessageToast.show("Enter all details")
				return
			}
			// Validate vehicle number format
			if (!vehicalNo.match(/^([A-Za-z]{2}\s?\d{2}\s?[A-Za-z]{2}\s?\d{4})$/)) {
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

	
// Method to handle unassigning selected slots
onUnassignPress: function () {
    var oTable = this.getView().byId("AssignedSlotsTable");
    var aSelectedItems = oTable.getSelectedItems();

    if (aSelectedItems.length === 0) {
        MessageBox.error("Please select at least one row to unassign");
        return;
    }

    var oModel = this.getOwnerComponent().getModel("ModelV2");

    // Loop through selected items to unassign each
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
        

	});
});