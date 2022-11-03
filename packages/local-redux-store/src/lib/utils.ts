import { distinctUntilChanged, map, pipe } from "rxjs";
import { miniRxNameSpace } from "./constants";

export function select<T, R>(mapFn: (state: T) => R) {
  return pipe(map(mapFn), distinctUntilChanged());
}

export function miniRxConsoleError(message: string, err: any): void {
  console.error(miniRxNameSpace + ': ' + message + '\nDetails:', err);
}
