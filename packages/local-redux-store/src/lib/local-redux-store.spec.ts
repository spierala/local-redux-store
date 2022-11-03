import { localReduxStore } from './local-redux-store';

describe('localReduxStore', () => {
  it('should work', () => {
    expect(localReduxStore()).toEqual('local-redux-store');
  });
});
