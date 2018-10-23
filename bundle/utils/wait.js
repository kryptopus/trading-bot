module.exports = async function(seconds) {
  if (seconds <= 0 || isNaN(seconds)) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
}
