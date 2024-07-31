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
	"sap/ndc/BarcodeScanner"





], function (Controller, JSONModel, Device, MessageToast, Fragment, Filter, FilterOperator, MessageBox, BarcodeScanner) {
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
					phone: "",
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

		statusTextFormatter: function (available) {
			return available ? "Empty" : "Not Empty";
		},
		statusStateFormatter: function (available) {
			return available ? "Success" : "Error"; // Or any other state like "Warning"
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

		onrefresh: function () {
			this.getView().byId("ReservationTable").getBinding("items").refresh();
		},


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
			var trimmedPhone = phone.trim();
			var trimmedDriverName = driverName.trim();
			// Validation for Vehicle Number
			var vehicleNumberPattern = /^[A-Za-z]{2}\d{2}[A-Za-z]{2}\d{4}$/;
			if (!vehicalNo || !vehicalNo.match(vehicleNumberPattern)) {
				sap.m.MessageBox.error("Please enter a valid vehicle number in the format AA22AA2222 or aa22aa2222.");
				return;
			}


			// Validate phone number
			var phoneRegex = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/;
			if (!(phoneRegex.test(trimmedPhone))) {
				MessageToast.show("Please enter a valid phone number");
				return;
			}
			debugger
			var oVehicleExist = await this.checkVehicleNo(oModel, oPayload.VehicalDeatils.vehicalNo)
			if (oVehicleExist) {
				MessageToast.show("Vehicle already exsist")
				return
			};
			// Validate driver name format
			var driverNameRegex = /^[a-z\s]{3,}$/i;
			if (!driverNameRegex.test(trimmedDriverName)) {
				MessageToast.show("Please enter a valid driver name (at least 3 letters, no special characters or numbers)");
				return;
			}
			var isReserved = await this.checkParkingLotReservation12(oModel, plotNo);
			if (isReserved) {
				sap.m.MessageBox.error(`Parking lot is already reserved. Please select another parking lot.`, {
					title: "Reservation Information",
					actions: sap.m.MessageBox.Action.OK
				});
				return;
			}
			var phoneExists = await this.checkPhoneExists(oModel, trimmedPhone);
			if (phoneExists) {
				sap.m.MessageBox.error("Phone number already associated with another vehicle Please Check mobile number");
				return;
			};
			var oplotnoexists = await this.plotnoexists(oModel, plotNo)
			if (!oplotnoexists) {
				MessageToast.show("Please Select Valid Plotn No")
				return
			}

			try {
				// Assuming createData method sends a POST request
				await this.createData(oModel, oPayload.VehicalDeatils, "/VehicalDeatils");
				//await this.createData(oModel, oPayload.VehicalDeatils, "/History");

				//  // Replace with your actual Twilio Account SID and Auth Token
				const accountSid = 'ACc087461333853e771f27f1589f7eb162';
				const authToken = '9e08ecf3299732c3019de82c6a8101a0';
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




				// Function to make an announcement
				function makeAnnouncement(message, lang = 'en-US') {
					// Check if the browser supports the Web Speech API
					if ('speechSynthesis' in window) {
						// Create a new instance of SpeechSynthesisUtterance
						var utterance = new SpeechSynthesisUtterance(message);

						// Set properties (optional)
						utterance.pitch = 1; // Range between 0 (lowest) and 2 (highest)
						utterance.rate = 0.75;  // Range between 0.1 (lowest) and 10 (highest)
						utterance.volume = 1; // Range between 0 (lowest) and 1 (highest)
						utterance.lang = lang; // Set the language

						// Speak the utterance
						debugger
						window.speechSynthesis.speak(utterance);

					} else {
						console.log('Sorry, your browser does not support the Web Speech API.');
					}

				}

				// Example usage
				//makeAnnouncement(`कृपया ध्यान दें। वाहन नंबर ${vehicalNo} को स्लॉट नंबर ${plotNo} द्वारा आवंटित किया गया है।`, 'hi-IN');
				makeAnnouncement(`దయచేసి వినండి. వాహనం నంబర్ ${vehicalNo} కు స్లాట్ నంబర్ ${plotNo} కేటాయించబడింది.`, 'te-IN');

				sap.m.MessageBox.information(
					`Vehicel No ${vehicalNo} allocated to Slot No ${plotNo}`,
					{
						title: "Allocation Information",
						actions: sap.m.MessageBox.Action.OK
					}
				);
				oModel.update("/PlotNOs('" + plotNo + "')", oPayload.plotNo, {
					success: function () {
						sap.m.MessageBox.success("Assigned")

					}.bind(this),
					error: function (oError) {

						sap.m.MessageBox.error("Failed to update: " + oError.message);
					}.bind(this)
				});
				this.triggerPrintForm(oPayload.VehicalDeatils);
			} catch (error) {
				console.error("Error:", error);

			}
			this.onclearvalues();
		},
		checkParkingLotReservation12: async function (oModel, plotNo) {
			return new Promise((resolve, reject) => {
				oModel.read("/Reservation", {
					filters: [
						new sap.ui.model.Filter("plotNo_plot_NO", sap.ui.model.FilterOperator.EQ, plotNo)
					],
					success: function (oData) {
						resolve(oData.results.length > 0);
					},
					error: function () {
						reject("An error occurred while checking parking lot reservation.");
					}
				});
			});
		},

		//validation for phone no checking
		checkPhoneExists: async function (oModel, trimmedPhone) {

			return new Promise((resolve, reject) => {
				oModel.read("/VehicalDeatils", {
					filters: [
						new sap.ui.model.Filter("phone", sap.ui.model.FilterOperator.EQ, trimmedPhone)
					],
					success: function (oData) {
						resolve(oData.results.length > 0);
					},
					error: function () {
						reject("An error occurred while checking phone number existence.");
					}
				});
			});
		},
		//validation for Vehicle no checking

		checkVehicleNo: async function (oModel, sVehicalNo) {
			return new Promise((resolve, reject) => {
				oModel.read("/VehicalDeatils", {
					filters: [
						new sap.ui.model.Filter("vehicalNo", sap.ui.model.FilterOperator.EQ, sVehicalNo)
					],
					success: function (oData) {
						resolve(oData.results.length > 0);
						// this.onModelRefresh();
					},
					error: function () {
						reject("An error occurred while checking vehicle number existence.");
					}
				});
			});
		},
		//Validation for plot checking
		plotnoexists: async function (oModel, splotNo) {
			return new Promise((resolve, reject) => {
				oModel.read("/PlotNOs", {
					filters: [
						new sap.ui.model.Filter("plot_NO", sap.ui.model.FilterOperator.EQ, splotNo)
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

		//validation for plotAvailability checking
		checkReservation: async function (oModel, sVehicalNo) {
			return new Promise((resolve, reject) => {
				oModel.read("/Reservation", {
					filters: [
						new sap.ui.model.Filter("vehicalNo", sap.ui.model.FilterOperator.EQ, sVehicalNo)
					],
					success: function (oData) {
						resolve(oData.results.length > 0);
						//this.onModelRefresh();
					},
					error: function () {
						reject("An error occurred while checking parking lot reservation.");
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
						//this.onModelRefresh();
					},
					error: function () {
						reject(
							"An error occurred while checking username existence."
						);
					}
				})
			})
		},
		// Clear the local model's VehicalDeatils property
		onclearvalues: function () {
			var oLocalModel = this.getView().getModel("localModel");
			oLocalModel.setProperty("/VehicalDeatils", {
				vehicalNo: "",
				driverName: "",
				phone: "",
				vehicalType: "",
				plotNo_plot_NO: ""
			});
			//this.onModelRefresh();
			// Clear any other necessary fields or models
			this.getView().byId("productInput").setValue("");
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

		onEditpress: function (oEvent) {
			var oButton = oEvent.getSource();
			var sButtonText = oButton.getText();

			var oRow = oButton.getParent(); // Get the table row
			var oCell = oRow.getCells()[4]; // Assuming the 5th cell contains both Text and ComboBox

			var oText = oCell.getItems()[0]; // Assuming the first item is Text
			var oComboBox = oCell.getItems()[1]; // Assuming the second item is ComboBox

			if (sButtonText === "edit") {
				// Switching to edit mode
				oButton.setText("Submit");
				oText.setVisible(false);
				oComboBox.setVisible(true);
				oComboBox.setEditable(true);
			} else {
				// Switching back to display mode
				oButton.setText("edit");
				oText.setVisible(true);
				oComboBox.setVisible(false);
				oComboBox.setEditable(false);

				var oTemp = oButton.getParent().getBindingContext().getObject().vehicalNo;
				var oVal = oText.getValue(); // Old plotNo
				var oC = oComboBox.getSelectedKey(); // New plotNo
				var oModel = this.getView().getModel("ModelV2");
				var that = this;

				// Update VehicalDeatils entity
				oModel.update("/VehicalDeatils('" + oTemp + "')", { plotNo_plot_NO: oC }, {
					success: function () {
						sap.m.MessageToast.show("VehicalDeatils updated successfully!");

						// Update PlotNOs entities sequentially
						oModel.update("/PlotNOs('" + oVal + "')", { available: true }, {
							success: function () {
								// Now update the new plotNo
								oModel.update("/PlotNOs('" + oC + "')", { available: false }, {
									success: function () {
										sap.m.MessageToast.show("PlotNOs updated successfully!");
										oModel.refresh(true);
										that.getView().byId("AssignedSlotsTable").getBinding("items").refresh(true);
									},
									error: function () {
										sap.m.MessageBox.error("Error occurs while updating new plotNo availability!");
									}
								});
							},
							error: function () {
								sap.m.MessageBox.error("Error occurs while updating old plotNo availability!");
							}
						});
					},
					error: function () {
						sap.m.MessageBox.error("Error occurs while updating VehicalDeatils!");
					}
				});
			}
		},



		onSuggestionItemSelected: function (oEvent) {
			// Handle suggestion item selection for plot number
			var oSelectedItem = oEvent.getParameter("selectedItem");
			var sPlotNo = oSelectedItem.getText(); // Assuming text is the plot number

			// Update local model with selected plot number
			var oLocalModel = this.getView().getModel("localModel");
			oLocalModel.setProperty("/plotNo_plot_NO", sPlotNo);
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
			if (oSelected.length > 1) {
				MessageBox.error("Please select only one row to assign.");
				return;
			}

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


		OnpressNotify: async function (oEvent) {


			var oButton = oEvent.getSource(),
				oView = this.getView();
			if (!this._pPopover) {
				this._pPopover = this.loadFragment("notification").then(function (oPopover) {
					oView.addDependent(oPopover);
					oPopover.setModel(oModel); // Bind model to the fragment
					return oPopover;
				});
			}
			this._pPopover.then(function (oPopover) {
				oPopover.openBy(oButton);
			});
			var oModel = this.getOwnerComponent().getModel("ModelV2");
			this.getView().byId("idnotificationDialog").setModel(oModel)
		},

		onItemClose: function (oEvent) {
			var oItem = oEvent.getSource(),
				oList = oItem.getParent();

			oList.removeItem(oItem);
			sap.m.MessageToast.show("Item Closed: ");
		},
		onnotifyClose: function () {
			this.byId("myPopover").close();
		},

		// onPrint: function () {
		// 	debugger;
		// 	// Ensure jsPDF is available
		// 	if (!window.jspdf || !window.jspdf.jsPDF) {
		// 		MessageBox.error("jsPDF library is not loaded.");
		// 		return;
		// 	}
		// 	// Access the jsPDF library
		// 	const { jsPDF } = window.jspdf;
		// 	// Ensure autoTable plugin is available
		// 	if (!jsPDF.API.autoTable) {
		// 		MessageBox.error("autoTable plugin is not loaded.");
		// 		return;
		// 	}
		// 	// Get the reference to the assigned slots table by its id
		// 	var oTable = this.byId("AssignedSlotsTable");
		// 	var aItems = oTable.getItems();
		// 	var doc = new jsPDF();

		// 	// Table headers
		// 	var headers = [["Vehicle Number", "Driver Name", "Driver Ph Number", "Vehicle Type", "Parking Lot number", "Entry Date"]];
		// 	var data = [];

		// 	// Extract data from table items
		// 	aItems.forEach(function (oItem) {
		// 		var aCells = oItem.getCells();
		// 		var aRowData = aCells.map(function (oCell) {
		// 			var sText = oCell.getText ? oCell.getText() : oCell.getValue ? oCell.getValue() : ""; // Handle both Text and Input
		// 			return sText;
		// 		});
		// 		data.push(aRowData);
		// 	});

		// 	// Generate PDF with autoTable
		// 	doc.autoTable({
		// 		head: headers,
		// 		body: data
		// 	});
		// 	doc.save("AssignedSlots.pdf");
		// },
		triggerPrintForm: function (vehicalDeatils) {
			// Create a temporary print area
			debugger
			var printWindow = window.open('', '', 'height=500,width=800');
			printWindow.document.write('<html><head><title>Parking Lot Allocation</title>');
			printWindow.document.write('<style>body{font-family: Arial, sans-serif;} table{width: 100%; border-collapse: collapse;} td, th{border: 1px solid #ddd; padding: 8px;} th{padding-top: 12px; padding-bottom: 12px; text-align: left; background-color: #4CAF50; color: white;}</style>');
			printWindow.document.write('</head><body>');
			printWindow.document.write('<h2>Parking Lot Allocation</h2>');
			printWindow.document.write('<table><tr><th>Field</th><th>Value</th></tr>');
			printWindow.document.write('<tr><td>Vehicle Number</td><td>' + vehicalDeatils.vehicalNo + '</td></tr>');
			printWindow.document.write('<tr><td>Driver Name</td><td>' + vehicalDeatils.driverName + '</td></tr>');
			printWindow.document.write('<tr><td>Phone</td><td>' + vehicalDeatils.phone + '</td></tr>');
			printWindow.document.write('<tr><td>Vehicle Type</td><td>' + vehicalDeatils.vehicalType + '</td></tr>');
			printWindow.document.write('<tr><td>Plot Number</td><td>' + vehicalDeatils.plotNo_plot_NO + '</td></tr>');
			printWindow.document.write('<tr><td>Assigned Date</td><td>' + vehicalDeatils.assignedDate + '</td></tr>');

			// Generate barcode
			debugger
			const barcodeValue = `${vehicalDeatils.vehicalNo}`;
			const canvas = document.createElement('canvas');
			JsBarcode(canvas, barcodeValue, {
				format: "CODE128",
				lineColor: "#0aa",
				width: 4,
				height: 40,
				displayValue: true
			});
			const barcodeImage = canvas.toDataURL("image/png");

			// Add barcode to print
			printWindow.document.write('<tr><td>Barcode</td><td><img src="' + barcodeImage + '" alt="Barcode"></td></tr>');
			printWindow.document.write('</table>');
			printWindow.document.write('</body></html>');
			printWindow.document.close();
			printWindow.print();
		},


		onModel: function () {
			const oModel = this.getView().getModel("ModelV2");
			var that = this;
			oModel.read("/Reservation", {
				success: function (odata) {
					var te = odata.results.length;
					that.byId("_IDGenButton1").setText(te);
					oModel.refresh(true);

				}, error: function (oError) {

				}

			})
		},
		onBeforeRendering: function () {
			this.onModel();
		},
		onAfterRendering: function () {
			this.onModel();
		},
		onScannerPress: function (oEvent) {
			debugger
			var that = this;
			sap.ndc.BarcodeScanner.scan(
				function (mResult) {
					if (mResult && mResult.text) {
						var scannedText = mResult.text;
						// sap.m.MessageBox.show("We got barcode: " + scannedText);
						that.unassignSlot(scannedText);
					}
				},
				function (error) {
					sap.m.MessageBox.error("Error occurred while scanning: " + error);
				}
			);
		},
		unassignSlot: async function (sVehicleNo) {
			debugger
			const that = this;
			const oModel = this.getView().getModel("ModelV2")
			return new Promise((resolve, reject) => {
				oModel.read("/VehicalDeatils", {
					filters: [
						new sap.ui.model.Filter("vehicalNo", sap.ui.model.FilterOperator.EQ, sVehicleNo)
					],
					success: function (oData) {
						resolve(oData.results.length > 0)
						const object = oData.results[0]
						const sPath = oModel.createKey("/VehicalDeatils", {
							vehicalNo: object.vehicalNo
						});

						var oHistoryPayload = {
							vehicalNo:  object.vehicalNo,
							driverName: object.driverName,
							phone:object.phone,
							vehicalType: object.vehicalType,
							assignedDate: object.assignedDate,
							unassignedDate: new Date(),
							plotNo: object.plotNo_plot_NO
						};
						that.moveToHistoryAfterSacn(oModel,oHistoryPayload);
						// delete the data in asiignned slots
						that.deleteFromVehicalDetailsAfterScan(oModel, sPath);

					},
					error: function () {
						reject("An error occurred while checking vehicle number existence.");
					}
				});
			});
		},
		moveToHistoryAfterSacn: async function (oModel, oHistory) {
			await this.createData(oModel, oHistory, "/History");
			// MessageToast.show("History added")
		},
		deleteFromVehicalDetailsAfterScan: function (oModel, sPath) {
			oModel.remove(sPath);
			// MessageToast.show("Removed from Assigned...................")

		},

		// unassignSlot: function (scannedText) {
		// 	var that = this;
		// 	var oModel = this.getView().getModel();

		// 	// Fetch data from the model
		// 	var aData = oModel.getProperty("/PlotNOs");
		// 	var aHistory = oModel.getProperty("/History");

		// 	// Debugging logs to check if aData and aHistory are correctly fetched
		// 	console.log("Initial PlotNOs: ", aData); 
		// 	console.log("Initial History: ", aHistory); 

		// 	// Check if data is valid
		// 	if (!Array.isArray(aData)) {
		// 		console.error("PlotNOs data is not an array or is undefined.");
		// 		return;
		// 	}
		// 	if (!Array.isArray(aHistory)) {
		// 		console.error("History data is not an array or is undefined.");
		// 		return;
		// 	}

		// 	var bSlotFound = false;
		// 	var oSlot = null;

		// 	// Iterate over the slots to find the matching slot
		// 	for (var i = 0; i < aData.length; i++) {
		// 		if (aData[i].plot_NO === scannedText) {
		// 			oSlot = aData[i];
		// 			aData.splice(i, 1); // Remove the slot from PlotNOs
		// 			bSlotFound = true;
		// 			break;
		// 		}
		// 	}

		// 	if (bSlotFound && oSlot) {
		// 		// Move the slot to history
		// 		that.moveToHistory(oModel, oSlot);

		// 		// Update PlotNOs availability to 'empty'
		// 		that.updatePlotAvailability(oModel, scannedText);

		// 		// Set the updated model properties
		// 		oModel.setProperty("/PlotNOs", aData);
		// 		oModel.setProperty("/History", aHistory);
		// 		sap.m.MessageBox.success("Slot " + scannedText + " was unassigned successfully and moved to history.");
		// 	} else {
		// 		sap.m.MessageBox.error("Slot " + scannedText + " not found.");
		// 	}

		// 	// Debugging logs to check the updated state
		// 	console.log("Updated PlotNOs: ", aData); 
		// 	console.log("Updated History: ", aHistory); 
		// },

		moveToHistory: function (oModel, oSlot) {
			var oHistory = {
				vehicalNo: oSlot.vehicalNo,
				driverName: oSlot.driverName,
				phone: oSlot.phone,
				vehicalType: oSlot.vehicalType,
				assignedDate: oSlot.assignedDate,
				unassignedDate: new Date(),
				plotNo: oSlot.plot_NO
			};

			// Add to History array
			var aHistory = oModel.getProperty("/History");
			aHistory.push(oHistory);
			oModel.setProperty("/History", aHistory);
		},

		updatePlotAvailability: function (oModel, plotNo) {
			var aData = oModel.getProperty("/PlotNOs");

			// Iterate through PlotNOs to update availability
			for (var i = 0; i < aData.length; i++) {
				if (aData[i].plot_NO === plotNo) {
					aData[i].available = true; // Set availability to true (empty)
					oModel.setProperty("/PlotNOs", aData);
					break;
				}
			}
		}
	});
});
