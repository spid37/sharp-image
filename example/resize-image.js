var Image = require(__dirname + '/../index');
// var Image = require('sharp-image');

var fs = require('fs');
var imageData = fs.readFileSync('bird.jpg');

image = new Image();

image.loadImage(imageData).then(function() {
  return image.resizeImage(100, 100, false);
}).then(function(data) {
  console.log("Output Resize Single");
  console.log(data);
});

image.loadImage(imageData).then(function() {
  return image.reformatImage("png");
}).then(function(data) {
  console.log("Output Reformat Image");
  console.log(data);
});

image.loadImage(imageData).then(function() {
  return image.batchResize([{
    height: 100,
    width: 100,
    isSquare: true
  }, {
    height: 320,
    width: 320,
    isSquare: false
  }, {
    height: 500,
    width: 500,
    isSquare: false
  }]);
}).then(function(data) {
  console.log("Output Resize Batch");
  console.log(data);
});
