namespace my.parkinglot;


using {cuid} from '@sap/cds/common';

//type VehicalNumber : String @assert.format: '^[A-Z]{2}-[0-9]{2}-[A-Z]{1,2}-[0-9]{1,4}$';

entity PlotNOs {
  key plot_NO           : String;
      inBoundOroutBound : String;
      available         : String;
      vehical           : Association to VehicalDeatils
}

entity VehicalDeatils {
  key vehicalNo      : String;
      driverName     : String;
      phone          : Integer64;
      vehicalType    : String;
      assignedDate   : DateTime;
      unassignedDate : String;
      plotNo         : Association to PlotNOs;
      

}

entity Allotment : cuid {
  vehicalDetails : Association to VehicalDeatils;
  plotNo         : Association to PlotNOs;
  assignedDate   : DateTime
}

entity History : cuid {
  vehicalNo      : String;
  driverName     : String;
  phone          : Integer64;
  vehicalType    : String;
  assignedDate   : DateTime;
  unassignedDate : DateTime;
  plotNo         : String;
}

entity Reservation {
  key vehicalNo    : String;
      driverName   : String;
      phone        : Integer64;
      vehicalType  : String;
      Expectedtime : DateTime;
      plotNo       : Association to PlotNOs;
      vendorname     : String;
      vendorNumber :Integer64;
      notify : String;
}
// define entity Notifications {
//     key id          : UUID;
//         nvendorName : String;
//         parkinglot  : Association to PlotNOs;
//         message     : String;
//         ndate       : Date;
// }

// entity Reservations {
//   key ID            : UUID;
//       vendorName    : String;
//       vendorNumber  : String;
//       driverName    : String;
//       driverNumber  : String;
//       vehicleType   : String;
//       vehicleNumber : String;
//       inTime        : DateTime;

// }

// entity ReservedSlots {
//   key ID            : UUID;
//       vendorName    : String;
//       vendorNumber  : String;
//       driverName    : String;
//       driverNumber  : String;
//       vehicleType   : String;
//       vehicleNumber : String;
//       reserveSlot   : Association to PlotNOs;
// }
