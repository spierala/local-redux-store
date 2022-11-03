import { Observable } from "rxjs";

export interface Action {
  type: string;
  // Allows any extra properties to be defined in an action.
  [x: string]: any;
}

export class Actions extends Observable<Action> {}

export type Reducer<StateType> = (state: StateType, action: Action) => StateType;
