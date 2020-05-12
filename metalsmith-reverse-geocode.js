const fetch = require('node-fetch');

const TOKEN = process.env.LOCATION_HQ_TOKEN;
// with `lat`/`lon` params
const REVERSE_GEOCODING_ENDPOINT =
  `https://eu1.locationiq.com/v1/reverse.php?key=${TOKEN}&format=json`;


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sequence(tasks, fn) {
  return tasks.reduce((promise, task) => {
    return promise.then(() => fn(task))
  }, Promise.resolve());
}


module.exports = function reverseGeocodePlugin (options) {
  options = options || {};

  return async function reverseGeocodeJob (files, metadata, done) {
    const filesWithLocation =
      Object.entries(files).filter(([filename, file]) => file.lat && file.lng);

    await sequence(filesWithLocation, async ([filename, file]) => {
      let address;
      try {
        // the service has 2 reqs/second and 60/minute rate limiting
        await sleep(1001);
        const response = await fetch(
          `${REVERSE_GEOCODING_ENDPOINT}&lat=${file.lat}&lon=${file.lng}`
        );
        const json = await response.json();
        address = json.display_name;
      } catch (error) {
        console.log(
          `Reverse geocoding ${file.lat},${file.lng} failed:\n${error}`
        );
      }
      file.address = address;
    });
    done();
  }
};
