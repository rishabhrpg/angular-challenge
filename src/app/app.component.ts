import {
  AfterViewInit, Component, OnDestroy, OnInit, ViewChild
} from "@angular/core";
import { BehaviorSubject, Observable, of } from "rxjs";

import { HttpClient, HttpParams } from "@angular/common/http";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { catchError, debounceTime, distinctUntilChanged, switchMap, tap } from "rxjs/operators";
import { MatSort, Sort } from "@angular/material/sort";

export interface Origin {
  [key: string]: any;
}

export interface Location {
  [key: string]: any;
}

export interface Character {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  origin: Origin;
  location: Location;
  image: string;
  episode: any[];
  url: string;
  created: Date;
}

export interface HttpRequest {
  info?: {
    count: number;
    pages: number;
    next: string;
    prev: string;
  };
  results?: Character[];
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  characters$!: Observable<any>;
  characterDataSource!: MatTableDataSource<Character>;
  characterDatabase = new HttpDatabase(this.httpClient);
  searchTerm$ = new BehaviorSubject<string>("");
  resultsEmpty$ = new BehaviorSubject<boolean>(false);
  status = "";
  resultsLength = 0;
  orderBy: '' | 'episode' | 'name' = '';
  orderDir: 'asc' | 'desc' = 'asc';
  sortedData: any[] = [];

  filterFormGroup!: FormGroup;
  searchField = new FormControl("");

  constructor(
    private httpClient: HttpClient,
    private fb: FormBuilder
  ) {

  }
  ngAfterViewInit(): void {
    this.paginator.page.subscribe(() => {
      this.characterDatabase
        .getCharacters(this.searchTerm$.value, this.status, this.paginator.pageIndex)
        .subscribe((response: HttpRequest) => {
          this.characterDataSource = new MatTableDataSource(response.results as any[]);
          this.resultsLength = response.info?.count as number;
          // this.characterDataSource.paginator = this.paginator;
          this.characters$ = this.characterDataSource.connect();
        });
    });

  }

  ngOnInit() {
    this.filterFormGroup = this.fb.group({});
    this.loadData();
  }

  ngOnDestroy() {
    if (this.characterDataSource) {
      this.characterDataSource.disconnect();
    }
  }

  loadData() {
    console.log('loading data');
    this.characterDatabase
      .search(this.searchTerm$)
      .subscribe((response) => {
        console.log('load data response ', this.searchTerm$.getValue(), response);
        this.updateCharacters(response);
        this.applyFilter();
      });
  }

  updateCharacters(response: any) {
    if (!response.info || !response.results) {
      this.resultsEmpty$.next(true)
      return
    }
    this.resultsEmpty$.next(false)
    this.resultsLength = response.info?.count;
    this.characterDataSource = new MatTableDataSource(response.results as any[]);
    console.log(this.characterDataSource);

    this.characterDataSource.paginator = this.paginator;
    this.characters$ = this.characterDataSource.connect();
  }


  applyFilter() {
    const filterValue = this.status;
    this.characterDataSource.filter = filterValue.trim().toLowerCase();
    this.characterDataSource.paginator = this.paginator;
    if (this.characterDataSource.paginator) {
      this.characterDataSource.paginator.firstPage();
    }
  }

  applyFilterFromDatabase(event: any) {
    this.characterDatabase.getCharacters(this.searchTerm$.value, event.value).subscribe(data => {
      this.updateCharacters(data);
    })
  }

  reOrder(event: any) {

    let orderedData = this.characterDataSource.data;
    switch (this.orderBy) {
      case 'name':
        orderedData = orderedData.sort((a, b) => compare(a.name, b.name, this.orderDir === 'asc'))
    }

    this.characterDataSource = new MatTableDataSource(orderedData);

    this.characterDataSource.paginator = this.paginator;
    this.characters$ = this.characterDataSource.connect();
  }

  updateResponse(response: string) {
    this.searchField.patchValue(response);
    this.searchTerm$.next(response);
  }

  sortData() {
    console.log(this.characterDataSource);
  }
}

export class HttpDatabase {
  constructor(private _httpClient: HttpClient) { }

  search(terms: Observable<string>) {
    return terms.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term =>
        this.getCharacters(term).pipe(
          catchError(() => {
            return of({ info: null, results: null });
          })
        )
      ),
    );
  }

  getCharacters(
    name: string = "",
    status: string = "",
    page: number = 0
  ): Observable<HttpRequest> {
    const apiUrl = "https://rickandmortyapi.com/api/character";
    return this._httpClient.get<HttpRequest>(apiUrl, {
      params: new HttpParams()
        .set('name', name)
        .set('status', status)
        .set('page', (page + 1).toString())
    });
  }
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
