import { Component, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { Platform, AlertController } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Storage } from '@ionic/storage';
import { filter } from 'rxjs/operators';

declare var google;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('map') mapElement: ElementRef;
  map: any;
  currentMapTrack: any;

  isTracking = false;
  trackedRoute = [];
  previousTracks = [];

  positionSubscription: Subscription;

  constructor(private plt: Platform, private geolocation: Geolocation, private storage: Storage, private alertCtrl: AlertController) {}

  ngOnInit() : void  {}

  ngAfterContentInit(): void{
    this.plt.ready().then(()=> {
      this.loadHistoricRoutes();

      let mapOptions = {
         zoom: 10,
         mapTypeId : google.maps.MapTypeId.ROADMAP,
         mapTypeControl: false,
         streetViewControl: false,
         fullscreenControl: false
      };

      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions); 

      this.geolocation.getCurrentPosition().then(pos =>{
        let latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        this.map.setCenter(latLng);
        this.map.setZoom(15);
      });
    });
  }

  loadHistoricRoutes(){
    this.storage.get('routes').then(data =>{
      if(data){
        this.previousTracks = data;
      }
    })
  }

  startTracking(){
    this.isTracking = true;
    this.trackedRoute = [];
 
    this.positionSubscription = this.geolocation.watchPosition()
      .pipe(
        filter((p) => p.coords !== undefined) //Filter Out Errors
      )
      .subscribe(data => {
        setTimeout(() => {
          this.trackedRoute.push({ lat: data.coords.latitude, lng: data.coords.longitude });
          this.redrawPath(this.trackedRoute);
        }, 0);
      });


  }

  redrawPath(path){
    if (this.currentMapTrack) {
      this.currentMapTrack.setMap(null);
    }
 
    if (path.length > 1) {
      this.currentMapTrack = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#ff00ff',
        strokeOpacity: 1.0,
        strokeWeight: 3
      });
      this.currentMapTrack.setMap(this.map);
    }

  }

  stopTracking(){
    let newRoute = {finished: new Date().getTime(), path: this.trackedRoute};
    this.previousTracks.push(newRoute);
    this.storage.set('routes', this.previousTracks);

    this.isTracking = false;
    this.positionSubscription.unsubscribe();
    this.currentMapTrack.setMap(null);
  }

  showHistoryRoute(route){
    this.redrawPath(route);
  }

  clearPreviousTracks(){
    this.previousTracks = [];
  }

}
