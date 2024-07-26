using my.parkinglot as my from '../db/data-model';

service CatalogService {
    entity PlotNOs        as projection on my.PlotNOs;
    entity VehicalDeatils as projection on my.VehicalDeatils;
    entity Allotment      as projection on my.Allotment;
    entity History        as projection on my.History;
    entity Reservation    as projection on my.Reservation;
    // entity Notifications as projection on my.Notifications;
}
