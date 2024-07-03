namespace my.parkinglot;

using {cuid} from '@sap/cds/common';

entity PlotNOs {
  key plot_NO           : String;
      inBoundOroutBound : String;
      available         : Boolean;
      vehical           : Association to VehicalDetails
}

entity VehicalDetails {
  key vehicalNo      : String;
      driverName     : String;
      phone          : Integer64;
      vehicalType    : String;
      assignedDate   : String;
      unassignedDate : String;
      plotNo         : Association to PlotNOs

}

entity Allotment : cuid {
  vehicalDetails : Association to VehicalDetails;
  plotNo         : Association to PlotNOs;
  assignedDate   : DateTime
}

entity History : cuid {
  vehicalNo      : String;
  driverName     : String;
  phone          : Integer64;
  vehicalType    : String;
  assignedDate   : String;
  unassignedDate : String;
  plotNo         : Association to PlotNOs
}


// entity UserLogin : cuid {
//   userName     : String;
//   userpassword : String;
//   typeOfUser   : String;

// }
