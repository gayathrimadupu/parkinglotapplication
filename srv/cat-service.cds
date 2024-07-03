using my.parkinglot as my from '../db/data-model';

service CatalogService {

   
entity PlotNOs  as projection on my.PlotNOs;
entity VehicalDetails  as projection on my.VehicalDetails;
entity Allotment  as projection on my.Allotment;
entity History as projection on my.History;



    

}
