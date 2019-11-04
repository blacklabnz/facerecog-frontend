import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { environment } from '../environments/environment';
import { error } from 'util';
declare var require: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private http: HttpClient) { }
  files: string[] = [];
  faceResponse: any
  fileToUpload: FormData;
  fileUpload: any;
  fileUpoadInitiated: boolean;
  fileDownloadInitiated: boolean;
  private funcKey: string;
  private blobBaseUrl: string;
  private funcBaseUrl: string;

  ngOnInit(): void {
    if (environment.environmentCode != "container") {
      this.funcKey = environment.funcKey;
      this.blobBaseUrl = "https://" + environment.enterpriseCode + "-" + environment.environmentCode + "-" + environment.locationCode + "-api-" + environment.contextCode + ".azurewebsites.net/api/blobstorage";
      this.funcBaseUrl = "https://" + environment.enterpriseCode + "-" + environment.environmentCode + "-" + environment.locationCode + "-fnc-" + environment.contextCode + ".azurewebsites.net/api/FaceFunction";
    }
    else {
      this.blobBaseUrl = environment.kubeblobBaseUrl;
      this.funcBaseUrl = environment.kubefuncBaseUrl;
    }
    this.showBlobs();
  }

  showBlobs() {
    this.http.get<string[]>(this.blobBaseUrl + '/listfiles').subscribe(result => {
      this.files = result;
    }, error => console.error(error));
  }


  addFile() {
    if (!this.fileUpoadInitiated) {
      document.getElementById('fileUpload').click();
    }
  }
  handleFileInput(files: any) {
    let formData: FormData = new FormData();
    formData.append("asset", files[0], files[0].name);
    this.fileToUpload = formData;
    this.onUploadFiles();
  }
  onUploadFiles() {
    if (this.fileUpoadInitiated) {
      return;
    }
    this.fileUpoadInitiated = true;
    if (this.fileToUpload == undefined) {
      this.fileUpoadInitiated = false;
      return false;
    }
    else {
      return this.http.post(this.blobBaseUrl + '/insertfile', this.fileToUpload)
        .subscribe((response: any) => {
          this.fileUpoadInitiated = false;
          this.fileUpload = '';
          if (response == true) {
            this.showBlobs();
          }
          else {
            alert('Error occured!');
            this.fileUpoadInitiated = false;
          }
        },
          err => console.log(err),
        );

    }
  }
  downloadFile(fileName: string) {
    this.fileDownloadInitiated = true;
    return this.http.get(this.blobBaseUrl + '/downloadfile/' + fileName, { responseType: "blob" })
      .subscribe((result: any) => {
        if (result.type != 'text/plain') {
          var blob = new Blob([result]);
          let saveAs = require('file-saver');
          let file = fileName;
          saveAs(blob, file);
          this.fileDownloadInitiated = false;
        }
        else {
          this.fileDownloadInitiated = false;
          alert('File not found in Blob!');
        }
      }
      );
  }
  deleteFile(fileName: string) {
    var del = confirm('Are you sure want to delete this file');
    if (!del) return;
    this.http.get(this.blobBaseUrl + '/deletefile/' + fileName).subscribe(result => {
      if (result != null) {
        this.showBlobs();
      }
    }, error => console.error(error));
  }
  checkFile(imageUrl: string){
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-functions-key': this.funcKey });
    let options = {headers: headers}

    this.http.post<any>(this.funcBaseUrl, '{"url":"' + imageUrl +'"}', options).subscribe(result => {
      this.faceResponse = JSON.stringify(result[0].faceAttributes);
      alert(JSON.parse(JSON.stringify(this.faceResponse)));
    }, error => console.error(error));
  }
}
