import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Character } from '../app.component';
import { DialogComponent } from '../dialog/dialog.component';

@Component({
  selector: 'app-character-card',
  templateUrl: './character-card.component.html',
  styleUrls: ['./character-card.component.scss']
})
export class CharacterCardComponent implements OnInit {

  @Input()
  public char!: Character;

  @Output()
  public response: EventEmitter<string> = new EventEmitter<string>();

  dialogRef!: MatDialogRef<DialogComponent>;

  constructor(
    public dialog: MatDialog,
  ) { }

  ngOnInit(): void {
  }

  setStatusColor(status: string) {
    if (status === "Alive") {
      return "green";
    }
    if (status === "Dead") {
      return "red";
    }
    return "";
  }

  openDialog(char: any) {
    this.dialogRef = this.dialog.open(DialogComponent, {
      data: {
        c: char
      }
    });

    this.dialogRef.afterClosed().subscribe((res: string) => {
      if (!res) {
        return;
      }
      this.response.emit(res);
    });
  }

}
