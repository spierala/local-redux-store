import { BehaviorSubject, map, Observable, observeOn, queueScheduler, Subject, tap } from "rxjs";
import { Action, Actions, Reducer } from "./models";
import { select } from "./utils";
import { defaultEffectsErrorHandler } from "./default-effects-error-handler";

export class LocalReduxStore<T extends object> {
  // ACTIONS
  private actionsSource = new Subject<Action>();
  actions$: Actions = this.actionsSource.asObservable();

  // APP STATE
  private stateSource = new BehaviorSubject<T>(undefined as unknown as T); // Init App State with empty object
  state$: Observable<T> = this.stateSource.asObservable();

  constructor(config: {reducer: Reducer<T>}) {
    // Listen to the Actions Stream and update state accordingly
    this.actions$
      .pipe(
        observeOn(queueScheduler), // Prevent stack overflow: https://blog.cloudboost.io/so-how-does-rx-js-queuescheduler-actually-work-188c1b46526e
        map(action => config.reducer(this.stateSource.getValue(), action)),
      )
      .subscribe(this.stateSource);

    this.dispatch({type: 'init-store'})
  }

  dispatch(action: Action) {
    this.actionsSource.next(action);
  }

  select<R>(mapFn: (state: T) => R): Observable<R> {
    return this.state$.pipe(select(mapFn));
  }

  effect(effect$: Observable<Action>) {
    const effectWithErrorHandler$: Observable<Action> = defaultEffectsErrorHandler(effect$);
    effectWithErrorHandler$.subscribe((action) => this.dispatch(action));
  }
}
