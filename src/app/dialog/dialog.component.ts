import { HttpClient } from "@angular/common/http";
import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

import { forkJoin, Observable } from "rxjs";
import { Character } from "../app.component";

@Component({
  selector: "app-dialog",
  templateUrl: "./dialog.component.html",
  styleUrls: ["./dialog.component.css"]
})
export class DialogComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Character,
    private dialogRef: MatDialogRef<DialogComponent>,
    private http: HttpClient
  ) {}

  panelOpenState: boolean;
  characterInfo: any;
  episodeList: any;
  characterList: any[];

  get character() {
    return this.data["c"];
  }

  requestCharacterAndEpisodes(): Observable<any[]> {
    const episodesUrlArray = [];

    this.character.episode.forEach(epUrl => {
      episodesUrlArray.push(epUrl.slice(-2).replace("/", ""));
    });

    let getCharacterInfo = this.http.get(
      "https://rickandmortyapi.com/api/character/1"
    );
    let getEpisodeList = this.http.get(
      `https://rickandmortyapi.com/api/episode/${episodesUrlArray}`
    );

    return forkJoin([getCharacterInfo, getEpisodeList]);
  }

  getCharacterInEpisodes(charactersList) {
    const charactersUrlArray = [];
    charactersList.forEach(characterUrl => {
      charactersUrlArray.push(characterUrl.slice(-2).replace("/", ""));
    });

    let characterEpisodes = this.http.get(
      `https://rickandmortyapi.com/api/character/${charactersUrlArray}`
    );

    forkJoin([characterEpisodes]).subscribe((results: any[]) => {
      this.characterList = results[0];
    });
  }

  goToSearch(name: string) {
    this.dialogRef.close(name);
  }

  ngOnInit() {
    this.requestCharacterAndEpisodes().subscribe(responseList => {
      this.characterInfo = responseList[0];

      if (responseList[1].length === undefined) {
        this.episodeList = [responseList[1]];
      } else {
        this.episodeList = responseList[1];
      }
    });
  }
}
