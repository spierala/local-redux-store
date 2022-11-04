import { Component, Input } from '@angular/core';
import {
  next,
  pause,
  play,
  prev,
  SlideshowStoreService,
  toggleDirection,
  toggleLoop,
  updateCurrentPhoto,
  updatePhotos,
  updateSpeed
} from "./slideshow-store.service";
import { FormControl, FormGroup } from "@angular/forms";
import { Subject, takeUntil } from "rxjs";


@Component({
  selector: 'app-slide-show',
  templateUrl: './slide-show.component.html',
  styleUrls: ['./slide-show.component.scss'],
  providers: [SlideshowStoreService]
})
export class SlideShowComponent {
  private destroy = new Subject<void>();

  private speedFc = new FormControl();
  formGroup = new FormGroup({
    speed: this.speedFc,
  });

  @Input()
  set photos(photos: string[]) {
    this.store.dispatch(updatePhotos(photos));
    this.store.dispatch(play);
  }

  constructor(public store: SlideshowStoreService) {
    this.store.speed$
      .pipe(takeUntil(this.destroy))
      .subscribe((v) => this.speedFc.setValue(v));

    this.speedFc.valueChanges
      .pipe(takeUntil(this.destroy))
      .subscribe((v) => this.store.dispatch(updateSpeed(v)));
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  prev() {
    this.store.dispatch(prev());
    this.store.dispatch(updateCurrentPhoto());
  }

  next() {
    this.store.dispatch(next());
    this.store.dispatch(updateCurrentPhoto());
  }

  play(): void {
    this.store.dispatch(play());
  }

  pause(): void {
    this.store.dispatch(pause());
  }

  toggleLoop(): void {
    this.store.dispatch(toggleLoop());
  }

  toggleDirection(): void {
    this.store.dispatch(toggleDirection())
  }
}
