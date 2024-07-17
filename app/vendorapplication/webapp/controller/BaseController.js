sap.ui.define(
    [
      "sap/ui/core/mvc/Controller",
      "sap/ui/core/Fragment"
    ],
    function (BaseController) {
      "use strict";
   
      return BaseController.extend("com.app.vendorapplication.controller.BaseController", {
        getRouter: function () {
          return this.getOwnerComponent().getRouter();
        },
        loadFragment: async function (sFragmentName) {
          const oFragment = await oFragment.load({
            id: this.getView().getId(),
            name: `com.app.vendorapplication.fragments.${sFragmentName}`,
            controller: this
          });
          this.getView().addDependent(oFragment);
          return oFragment
        },
   
        createData: function (oModel, oPayload, sPath) {
          return new Promise(function (resolve, reject) {
            oModel.create(sPath, oPayload, {
              refreshAfterChange: true,
              success: function () {
                resolve();
              },
              error: function (oError) {
                reject(oError);
              }
            });
          });
        }
      });
    }
  );