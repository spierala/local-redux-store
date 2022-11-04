import { Injectable } from '@angular/core';
import { LocalReduxStore } from "@mini-rx/local-redux-store";
import { action, on, payload, reducer } from "ts-action";
import { ofType } from "ts-action-operators";
import { combineLatest, filter, interval, map, merge, switchMap, takeUntil, withLatestFrom } from "rxjs";

export type Direction = 'forward' | 'backward';

export interface SlideShowState {
  photos: string[];
  index: number;
  speed: number;
  loop: boolean;
  direction: Direction;
}

export const initialState: SlideShowState = {
  photos: [],
  index: 0,
  speed: 1000, // ms
  loop: true,
  direction: 'forward',
};

// Actions
export const play = action('[Slideshow] play');
export const pause = action('[Slideshow] pause');
export const prev = action('[Slideshow] prev');
export const next = action('[Slideshow] next');
export const toggleLoop = action('[Slideshow] toggleLoop');
export const toggleDirection = action('[Slideshow] toggleDirection');
export const updatePhotos = action(
  '[Slideshow] updatePhotos',
  payload<string[]>()
);
export const updateCurrentPhoto = action('[Slideshow] updateCurrentPhoto');
export const updateSpeed = action('[Slideshow] updateSpeed', payload<number>());

// Reducer
export const slideShowReducer = reducer<SlideShowState>(
  initialState,
  on(updatePhotos, (state, {payload}) =>
    ({...state, photos: payload})
  ),
  on(updateSpeed, (state, {payload}) => ({...state, speed: payload})),
  on(toggleLoop, (state) => ({...state, loop: !state.loop})),
  on(toggleDirection, (state) => ({
    ...state,
    direction: state.direction === 'forward' ? 'backward' : 'forward',
  })),
  on(next, (state) => ({...state, direction: 'forward'})),
  on(prev, (state) => ({...state, direction: 'backward'})),
  on(updateCurrentPhoto, (state) => {
    let newIndex: number;

    if (state.direction === 'forward') {
      if (state.index < state.photos.length - 1) {
        newIndex = state.index + 1;
      } else {
        newIndex = state.loop ? 0 : state.index;
      }
    } else if (state.direction === 'backward') {
      if (state.index > 0) {
        newIndex = state.index - 1;
      } else {
        newIndex = state.loop ? state.photos.length - 1 : state.index;
      }
    } else {
      newIndex = state.index;
    }
    return {...state, index: newIndex};
  })
);

@Injectable()
export class SlideshowStoreService extends LocalReduxStore<SlideShowState> {
  private isFirstPhoto$ = this.select(({index, loop, direction}) => {
    if (!loop && direction === 'backward') {
      return 0 === index;
    }
    return false;
  });
  private isLastPhoto$ = this.select(({photos, index, loop, direction}) => {
    if (!loop && direction === 'forward') {
      return photos.length - 1 === index;
    }
    return false;
  });
  private stopInterval$ = merge(
    this.isFirstPhoto$.pipe(
      filter((v) => !!v) // We only care about emitting `true`
    ),
    this.isLastPhoto$.pipe(
      filter((v) => !!v) // We only care about emitting `true`
    ),
    this.actions$.pipe(ofType(pause)),
    this.actions$.pipe(ofType(prev)),
    this.actions$.pipe(ofType(next))
  );

  private currentPhoto$ = this.select(({photos, index}) => photos[index])
  speed$ = this.select(state => state.speed);
  private direction$ = this.select(state => state.direction);
  private loop$ = this.select(state => state.loop);

  // View model
  vm$ = combineLatest({
    currentPhoto: this.currentPhoto$,
    loop: this.loop$,
    direction: this.direction$
  })

  constructor() {
    // Register Reducer
    super({reducer: slideShowReducer});

    // Register Effect
    this.effect(this.actions$.pipe(
      ofType(play, updateSpeed),
      withLatestFrom(this.speed$),
      switchMap(([, speed]) =>
        interval(speed).pipe(takeUntil(this.stopInterval$))
      ),
      map(() => updateCurrentPhoto())
    ))
  }
}
