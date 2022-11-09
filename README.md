[![NPM](https://img.shields.io/npm/v/@mini-rx/local-redux-store)](https://www.npmjs.com/package/@mini-rx/local-redux-store)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-blue.svg?style=flat-square)](https://github.com/semantic-release/semantic-release)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

# local-redux-store
Local Redux Store based on RxJS.

Usually Redux is used for global state management, but this RxJS Redux Store is made for **local state management** and can be destroyed together with the corresponding component.

🚀 See Local Redux Store in action:
- [Angular "Slideshow" demo](https://stackblitz.com/edit/angular-ivy-y1xlfc?file=src/app/slide-show/slide-show-store.service.ts)

## What's Included
-   RxJS powered **local** state management
-   State and actions are exposed as RxJS Observables
-   `LocalReduxStore` API:
    -   register one reducer per `LocalReduxStore` instance
    -   `actions$`: the action stream
    -   `dispatch`: dispatch an Action to the `actions$` stream
    -   `select`: select Observable state
    -   `effect`: register effects to run side effects like API calls
    -   `destroy`: destroy the Store and cleanup internal subscriptions 
    -   Memoized Selectors: `createSelector`
-   [Support for ts-action](https://github.com/cartant/ts-action): Create and consume actions with as little boilerplate as possible

## Example

Following code is taken from the Angular "Slideshow" demo:

```typescript
import { LocalReduxStore } from '@mini-rx/local-redux-store';
import { Injectable } from '@angular/core';
import { action, on, payload, reducer } from 'ts-action';
import { ofType } from 'ts-action-operators';
import {
  combineLatest,
  filter,
  interval,
  map,
  merge,
  switchMap,
  takeUntil,
  withLatestFrom,
} from 'rxjs';

type Direction = 'forward' | 'backward';

interface SlideShowState {
  photos: string[];
  index: number;
  speed: number;
  loop: boolean;
  direction: Direction;
}

const initialState: SlideShowState = {
  photos: [],
  index: 0,
  speed: 1000, // ms
  loop: true,
  direction: 'forward',
};

// Actions
export const play = action('play');
export const pause = action('pause');
export const prev = action('prev');
export const next = action('next');
export const toggleLoop = action('toggleLoop');
export const toggleDirection = action('toggleDirection');
export const updatePhotos = action('updatePhotos', payload<string[]>());
export const updateCurrentPhoto = action('updateCurrentPhoto');
export const updateSpeed = action('updateSpeed', payload<number>());

// Reducer
const slideShowReducer = reducer<SlideShowState>(
  initialState,
  on(updatePhotos, (state, { payload }) => ({ ...state, photos: payload })),
  on(updateSpeed, (state, { payload }) => ({ ...state, speed: payload })),
  on(toggleLoop, (state) => ({ ...state, loop: !state.loop })),
  on(toggleDirection, (state) => ({
    ...state,
    direction: state.direction === 'forward' ? 'backward' : 'forward',
  })),
  on(next, (state) => ({ ...state, direction: 'forward' })),
  on(prev, (state) => ({ ...state, direction: 'backward' })),
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
    return { ...state, index: newIndex };
  })
);

@Injectable()
export class SlideshowStoreService extends LocalReduxStore<SlideShowState> {
  private isFirstPhoto$ = this.select(({ index, loop, direction }) => {
    if (!loop && direction === 'backward') {
      return 0 === index;
    }
    return false;
  });
  private isLastPhoto$ = this.select(({ photos, index, loop, direction }) => {
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

  private currentPhoto$ = this.select(({ photos, index }) => photos[index]);
  speed$ = this.select((state) => state.speed);
  private direction$ = this.select((state) => state.direction);
  private loop$ = this.select((state) => state.loop);

  // View model
  vm$ = combineLatest({
    currentPhoto: this.currentPhoto$,
    loop: this.loop$,
    direction: this.direction$,
  });

  constructor() {
    // Register Reducer
    super({ reducer: slideShowReducer });

    // Register Effect
    this.effect(
      this.actions$.pipe(
        ofType(play, updateSpeed),
        withLatestFrom(this.speed$),
        switchMap(([, speed]) =>
          interval(speed).pipe(takeUntil(this.stopInterval$))
        ),
        map(() => updateCurrentPhoto())
      )
    );
  }
}
```

