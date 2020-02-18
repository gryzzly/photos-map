module.exports = function parseDMS(input) {
  var parts = input.split(/[^\d\w\.]+/);
  var lat = convertDMSToDD(parts[0], parts[2], parts[3], parts[4]);
  var lng = convertDMSToDD(parts[5], parts[7], parts[8], parts[9]);

  return {
    Latitude : lat,
    Longitude: lng,
    Position : lat + ',' + lng
  }
};


function convertDMSToDD(degrees, minutes, seconds, direction) {
  var dd = Number(degrees) + Number(minutes)/60 + Number(seconds)/(60*60);

  if (direction == "S" || direction == "W") {
    dd = dd * -1;
  } // Don't do anything for N or E
  return dd;
}