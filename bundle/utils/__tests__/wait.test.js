const wait = require("../wait");

describe("wait", () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  it("should resolve after specified seconds", done => {
    wait(42)
      .then(() => {
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 42000);
        done();
      });
    jest.runAllTimers();
  });

  it("should handle negative seconds as immediate resolution", done => {
    wait(-7)
      .then(() => {
        done();
      });
  });

  it("should handle Not a Number argument as immediate resolution", done => {
    wait(NaN)
      .then(() => {
        done();
      });
  });
});
