sap.ui.define([
	"./Basecontroller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/m/MessageToast",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/m/MessageBox",

], function (Controller, JSONModel, Device, MessageToast, Fragment, Filter, FilterOperator, MessageBox) {
	"use strict";
	return Controller.extend("com.app.project1.controller.View1", {
		onInit: function () {
			this._setParkingLotModel();

			// Load local JSON model for the view
			var oModel = new sap.ui.model.json.JSONModel(sap.ui.require.toUrl("com/app/project1/data/model.json"));
			this.getView().setModel(oModel);
			var oNotificationModel = new sap.ui.model.json.JSONModel({
				Notifications: []
			});
			this.getView().setModel(oNotificationModel, "NotificationModel");


			const oLocalModel = new sap.ui.model.json.JSONModel({
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
				},
				Requests: [] // To store requests for notifications
			});
			this.getView().setModel(oLocalModel, "localModel");

			var oModelV2 = this.getOwnerComponent().getModel("ModelV2");
			this.getView().byId("pageContainer").setModel(oModelV2);

			var oViewModel = new sap.ui.model.json.JSONModel({
				ImageURL: "https://i.postimg.cc/HxdccK23/loading-docks-19268044-transformed-3.jpg"
			});
			this.getView().setModel(oViewModel, "viewModel");

			// Set the model for the vehicle type dropdown
			const oVehicleTypeModel = new sap.ui.model.json.JSONModel({
				vehicleTypes: [
					{ key: "inbound", text: "Inbound" },
					{ key: "outbound", text: "Outbound" }
				]
			});
			this.getView().setModel(oVehicleTypeModel, "vehicleTypeModel");


			// Optionally log to verify the model and property
			var imageURL = this.getView().getModel("viewModel").getProperty("/ImageURL");
			console.log("Image URL:", imageURL);
			// var oPage2 = this.byId("page2");
			// if (oPage2) {
			//     oPage2.addStyleClass("pageBackground");
			// }
			// Get the current date
var today = new Date();
today.setHours(0, 0, 0, 0); // Ensure the time is set to 00:00:00

// Set the minimum date for the DateTimePicker
var oDateTimePicker = this.getView().byId("idinputdatetimepicker");
oDateTimePicker.setMinDate(today);

// Set display format to show date and time
oDateTimePicker.setDisplayFormat("yyyy-MM-dd HH:mm:ss");
oDateTimePicker.setValueFormat("yyyy-MM-dd HH:mm:ss");
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
			const vehicalType = this.getView().byId("idvehiceltype1").getSelectedKey();
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



			// Validation for Phone Number
			if (!phone || !phone.match(/^[9876]\d{9}$/)) {
				sap.m.MessageBox.error("Please enter a valid phone number starting with 9, 8, 7, or 6 and exactly 10 digits.");
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
				var create = await this.createData(oModel, oPayload.VehicalDeatils, "/VehicalDeatils");
				if (create) {

					function makeAnnouncement(message, lang = 'en-US') {
						// Check if the browser supports the Web Speech API
						if ('speechSynthesis' in window) {
							// Create a new instance of SpeechSynthesisUtterance
							var utterance = new SpeechSynthesisUtterance(message);

							// Set properties (optional)
							utterance.pitch = 1; // Range between 0 (lowest) and 2 (highest)
							utterance.rate = 0.77;  // Range between 0.1 (lowest) and 10 (highest)
							utterance.volume = 1; // Range between 0 (lowest) and 1 (highest)
							utterance.lang = lang; // Set the language

							// Speak the utterance
							window.speechSynthesis.speak(utterance);
						} else {
							console.log('Sorry, your browser does not support the Web Speech API.');
						}
					}

					// Example usage
					// makeAnnouncement(`कृपया ध्यान दें। वाहन नंबर ${vehicalNo} को स्लॉट नंबर ${plotNo} द्वारा आवंटित किया गया है।`, 'hi-IN');
					makeAnnouncement(`దయచేసి వినండి. వాహనం నంబర్ ${vehicalNo}కు స్లాట్ నంబర్ ${plotNo} కేటాయించబడింది.`, 'te-IN');

					// Replace with your actual Twilio Account SID and Auth Token
					const accountSid = 'ACc087461333853e771f27f1589f7eb162';
					const authToken = '8fe2b5650786a1efc6b59a17cafc05d0';
					var to = "+91" + phone;

					// Function to send SMS using Twili
					debugger
					const toNumber = to; // Replace with recipient's phone number
					const fromNumber = '+13203173039'; // Replace with your Twilio phone number
					const messageBody = 'Hello '
						+ driverName +
						',\n'
						+
						'Your vehicle ('
						+ vehicalNo +
						') has been assigned to parking lot '
						+
						plotNo
						+
						'.\n'
						+
						'Please park your vehicle in the assigned slot.\n'
						+
						'Thank you,\n'
						+
						'By Artihcus Global.\n\n'


					// Twilio API endpoint for sending messages
					const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

					// Payload for the POST request
					const payload = {
						To: toNumber,
						From: fromNumber,
						Body: messageBody
					};

					// Send POST request to Twilio API using jQuery.ajax
					$.ajax({
						url: url,
						type: 'POST',
						headers: {
							'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken)
						},
						data: payload,
						success: function (data) {
							console.log('SMS sent successfully:', data);
							// Handle success, e.g., show a success message
							sap.m.MessageToast.show('SMS sent successfully!');
						},
						error: function (xhr, status, error) {
							console.error('Error sending SMS:', error);
							// Handle error, e.g., show an error message
							sap.m.MessageToast.show('Failed to send SMS: ' + error);
						}
					});

				}
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



		Unassign: function () {
			var oTable = this.getView().byId("AssignedSlotsTable");
			var aSelectedItems = oTable.getSelectedItems();

			// Check if at least one item is selected
			if (aSelectedItems.length === 0) {
				MessageBox.error("Please select at least one row to unassign");
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
		onUpdateSlotPress: function () {
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

		// loadFragment: function (oSelectedObject) {
		// 	debugger
		// 	// Load fragment
		// 	Fragment.load({
		// 		id: this.getView().getId(),
		// 		name: "com.app.project1.fragment.UpdateSlotDialog",
		// 		controller: this
		// 	}).then(function (oFragment) {
		// 		// Set data to fragment model
		// 		var oFragmentModel = new JSONModel(oSelectedObject);
		// 		this.getView().setModel(oFragmentModel, "localModel");

		// 		// Open fragment as dialog
		// 		this.getView().addDependent(oFragment);
		// 		oFragment.open();
		// 	}.bind(this));
		// },

		onUpdateDialogSave: function () {
			debugger
			var oModel = this.getOwnerComponent().getModel("ModelV2");
			var oLocalModel = this.getView().getModel("localModel");
			var oPayload = oLocalModel.getData(),
				oSelected = this.getView().byId("AssignedSlotsTable").getSelectedItem().getBindingContext().getObject(),
				oOldSlot = oSelected.plotNo_plot_NO
			// Perform validation or additional logic if needed

			// Update the selected row with updated plot number
			oModel.update("/VehicalDeatils('" + oPayload.vehicalNo + "')", oPayload, {
				success: function () {
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
				error: function (oError) {
					MessageBox.error("Failed to update slot: " + oError.message);
				}
			});
		},
		onUpdateDialogCancel: function () {
			// Close dialog on cancel
			this.getView().byId("updateDialog").close();
		},

		onSuggestionItemSelected: function (oEvent) {
			// Handle suggestion item selection for plot number
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var sPlotNo = oSelectedItem.getText(); // Assuming text is the plot number

			// Update local model with selected plot number
			var oLocalModel = this.getView().getModel("localModel");
			oLocalModel.setProperty("/plotNo_plot_NO", sPlotNo);
		},
		onReservePressbtn: async function () {
			debugger
			var oView = this.getView();
			const oModel = oView.byId("pageContainer").getModel("ModelV2");

			// Get input values
			var sVehicleNo = oView.byId("InputVehicleno").getValue();
			var sDriverName = oView.byId("InputDriverName").getValue();
			var sPhoneNo = oView.byId("InputPhonenumber").getValue();
			var sVehicleType = oView.byId("InputVehicletype").getSelectedKey();
			var sParkingLot = oView.byId("idcombox1").getValue();
			var oDateTimePicker = oView.byId("idinputdatetimepicker");
			var oSelectedDate = oDateTimePicker.getDateValue();

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

			// Check if Vehicle Number already exists
			const vehicleExists = await this.checkVehicleExists(oModel, sVehicleNo);
			if (vehicleExists) {
				sap.m.MessageBox.error("Vehicle number already exists. Please enter a different vehicle number.");
				return;
			}

			// Construct payload for reservation entity
			var newmodel = new sap.ui.model.json.JSONModel({
				vehicalNo: sVehicleNo,
				driverName: sDriverName,
				phone: sPhoneNo,
				vehicalType: sVehicleType,
				plotNo_plot_NO: sParkingLot,
				Expectedtime: oSelectedDate // This will store only the date part
			});

			this.getView().byId("page5").setModel(newmodel, "newmodel");
			const oPayload = this.getView().byId("page5").getModel("newmodel").getProperty("/");

			// Call OData service to create reservation
			try {
				await this.createData(oModel, oPayload, "/Reservation");

				// Update the status of the parking slot in Page 1
				await this.updateParkingSlotStatus(oModel, sParkingLot, false);

				// Clear input fields after successful reservation
				
				this.addNotification(sDriverName, sVehicleNo, sVehicleType, sParkingLot, oSelectedDate);
				
				sap.m.MessageBox.success("Parking lot reserved successfully");
			
			} catch (error) {
				sap.m.MessageBox.error("Failed to create reservation. Please try again.");
				console.error("Error creating reservation:", error);
			}
			this.clearInputFields();
		},

		// Function to check if vehicle number exists in backend
		checkVehicleExists: async function (oModel, sVehicleNo) {
			return new Promise((resolve, reject) => {
				oModel.read("/VehicalDeatils", {
					filters: [
						new sap.ui.model.Filter("vehicalNo", sap.ui.model.FilterOperator.EQ, sVehicleNo)
					],
					success: function (oData) {
						resolve(oData.results.length > 0);
					},
					error: function () {
						reject("An error occurred while checking vehicle number existence.");
					}
				});
			});
		},
		addNotification: function (sDriverName, sVehicleNo, sVehicleType, sParkingLot, oSelectedDateTime) {
			debugger
			var oNotificationModel = this.getView().getModel("NotificationModel");
			var aNotifications = oNotificationModel.getData().Notifications;

			var oNewNotification = {
				title: "Booking request",
				description: `Driver Name: ${sDriverName}, Vehicle No: ${sVehicleNo}, Vehicle Type: ${sVehicleType}, Parking Lot: ${sParkingLot}, Expected Time: ${oSelectedDateTime}`,
				datetime: new Date().toISOString(),
				priority: "Low",
				unread: true
			};

			var bExists = aNotifications.some(function (notification) {
				return notification.description === oNewNotification.description && notification.datetime === oNewNotification.datetime;
			});

			// Add new notification if it doesn't exist
			if (!bExists) {
				aNotifications.push(oNewNotification);
			}

			// Update the model
			oNotificationModel.setProperty("/Notifications", aNotifications);
		},

		// Function to update the status of the parking slot
		updateParkingSlotStatus: async function (oModel, plotNo, available) {
			return new Promise((resolve, reject) => {
				oModel.update(`/PlotNOs('${plotNo}')`, { available: available }, {
					success: function () {
						resolve();
					},
					error: function (oError) {
						reject("Failed to update parking slot status.");
					}
				});
			});
		},

		// Function to clear input fields
		clearInputFields: function () {
			var oView = this.getView();
			oView.byId("InputVehicleno").setValue("");
			oView.byId("InputDriverName").setValue("");
			oView.byId("InputPhonenumber").setValue("");
			oView.byId("InputVehicletype").setValue("");
			oView.byId("idcombox1").setValue("");
			oView.byId("idinputdatetimepicker").setDateValue(null);
		},

		// Function to create data in backend
		createData: async function (oModel, oPayload, sPath) {
			return new Promise((resolve, reject) => {
				oModel.create(sPath, oPayload, {
					success: function (oData) {
						resolve(oData);
					},
					error: function (oError) {
						reject(oError);
					}
				});
			});
		},

		onReservePressbtnclear: function () {
			var oView = this.getView();
			oView.byId("InputVehicleno").setValue("");
			oView.byId("InputDriverName").setValue("");
			oView.byId("InputPhonenumber").setValue("");
			oView.byId("InputVehicletype").setValue("");
			oView.byId("idcombox1").setValue("");
			oView.byId("idinputdatepicker").setValue(null); // Clear the date picker
		},
		onpressassignrd: async function () {
			debugger
			var oSelected = this.byId("ReservationTable").getSelectedItems();
			if (oSelected.length === 0) {
				MessageBox.error("Please Select atleast row to Assign");
				return
			};

			var oSelectedRow = this.byId("ReservationTable").getSelectedItem().getBindingContext().getObject();
			var orow = this.byId("ReservationTable").getSelectedItem().getBindingContext().getPath();
			const intime = new Date;
			var resmodel = new JSONModel({
				vehicalNo: oSelectedRow.vehicalNo,
				driverName: oSelectedRow.driverName,
				phone: oSelectedRow.phone,
				vehicalType: oSelectedRow.vehicalType,
				assignedDate: intime,
				plotNo_plot_NO: oSelectedRow.plotNo_plot_NO,
			});
			var temp = oSelectedRow.plotNo_plot_NO;
			const oModel = this.getView().byId("pageContainer").getModel("ModelV2");
			this.getView().byId("page8").setModel(resmodel, "resmodel");
			this.getView().byId("page8").getModel("resmodel").getProperty("/");
			oModel.create("/VehicalDeatils", resmodel.getData(), {
				success: function (odata) {
					sap.m.MessageToast.show("success");
					debugger
					oModel.remove(orow, {
						success: function () {
							sap.m.MessageToast.show("Assigned successfully");
							oModel.refresh()
							oModel.update("/PlotNOs('" + temp + "')", { available: false }, {
								success: function () {
									sap.m.MessageToast.show("Assigned successfully");
									oModel.refresh();
								}, error: function () {
									sap.m.MessageBox.error("error");
								}

							})
						},
						error: function (oError) {
							sap.m.MessageBox.error("Failed to update : " + oError.message);
						}

					})

				},
				error: function (oError) {
					sap.m.MessageBox.error("Failed to update : " + oError.message);
				}
			})

		},

		_setParkingLotModel: function () {
			var oModel = this.getOwnerComponent().getModel("ModelV2");
			var that = this;

			oModel.read("/PlotNOs", {
				success: function (oData) {
					//	console.log("Fetched Data:", oData);
					var aItems = oData.results;
					var availableCount = aItems.filter(item => item.available === true).length;
					var occupiedCount = aItems.filter(item => item.available === false).length;

					var aChartData = {
						Items: [
							{
								available: true,
								Count: availableCount,
								available: "Empty"
							},
							{
								available: false,
								Count: occupiedCount,
								available: "Not Empty"
							}
						]
					};
					var oParkingLotModel = new JSONModel();
					oParkingLotModel.setData(aChartData);
					that.getView().setModel(oParkingLotModel, "ParkingLotModel");
				},
				error: function (oError) {
					console.error(oError);
				}
			});
		},

		myOnClickHandler: function (oEvent) {
			// Your click handler logic
		},

		handleRenderComplete: function (oEvent) {
			// Your render complete handler logic
		},
		OnpressNotify: function (oEvent) {
			debugger
			var oButton = oEvent.getSource(),
				oView = this.getView();

			// create popover
			if (!this._pPopover) {
				debugger
				this._pPopover = this.loadFragment("Notification").then(function (oPopover) {
					oView.addDependent(oPopover);
					oPopover.bindElement("");
					return oPopover;
				});
			}
			this._pPopover.then(function (oPopover) {
				oPopover.openBy(oButton);
			});
		}
		
		

	});
});
