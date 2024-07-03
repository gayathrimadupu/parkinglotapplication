sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
   
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel"
],
function (Controller, MessageToast, Filter, FilterOperator, JSONModel) {
    "use strict";

    return Controller.extend("com.app.project1.controller.View1", {
        onInit: function () {
            var oModel = new JSONModel(sap.ui.require.toUrl("com/app/project1/data/model.json"));
            this.getView().setModel(oModel);

            var oModelV2 = this.getOwnerComponent().getModel("ModelV2");
            this.getView().byId("pageContainer").setModel(oModelV2);
 
            

            
        },

        onItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            this.byId("pageContainer").to(this.getView().createId(oItem.getKey()));
        }
    });
});

//         onLogin: function () {
//             var oView = this.getView();

//             var sUserID = oView.byId("usernameInput").getValue();
//             var sPassword = oView.byId("passwordInput").getValue();

//             if (!sUserID || !sPassword) {
//                 MessageToast.show("please enter required Credentials");
//                 return;
//             }

//             var oModel = this.getView().getModel();
//             var oBinding = oModel.bindList("/UserLogin");

//             oBinding.filter([
//                 new Filter("userName", FilterOperator.EQ, sUserID),
//                 new Filter("userpassword", FilterOperator.EQ, sPassword)
//             ]);

//             oBinding.requestContexts().then(function (aContexts) {  //requestContexts is called to get the contexts (matching records) from the backend.
//                 debugger
//                 if (aContexts.length > 0) {
//                     var ID = aContexts[0].getObject().ID;
//                     var userType = aContexts[0].getObject().typeOfUser;
//                     var sUser = aContexts[0].getObject().userName;
//                     if (userType === "Guard") {
//                         MessageToast.show(sUser + " " + "Login Successful");
//                         var oRouter = this.getOwnerComponent().getRouter();
//                         oRouter.navTo("RouteGuard", { userName: ID });
//                         var oView = this.getView()
//                         oView.byId("usernameInput").setValue("");
//                         oView.byId("passwordInput").setValue("");
//                     }
//                     else {
//                         MessageToast.show("Login Successful");
//                         var oRouter = this.getOwnerComponent().getRouter();
//                         oRouter.navTo("Routesupervisor", { userName: ID });
//                         var oView = this.getView()
//                         oView.byId("usernameInput").setValue("");
//                         oView.byId("passwordInput").setValue("");
//                     }

//                 } else {
//                     MessageToast.show("Invalid username or password.");
//                 }
//             }.bind(this)).catch(function () {
//                 MessageToast.show("An error occurred during login.");
//             });
//         }
//     });
// });

