module.exports = class Signal {
  async isValidated() {
    const now = new Date();

    if (now.getSeconds() === 0) {
      return true;
    }

    return false;
  }
}
