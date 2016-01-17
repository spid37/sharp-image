var Promise = require("bluebird");
var _ = require("lodash");
var sharp = require('sharp');

function SharpImage() {
  this.sharpImage = null;

  this.defaultOutput = 'png';
  this.outputFormat = this.defaultOutput;

  this.validOutputFormats = ['jpeg', 'png'];
}

// use the image buffer to create a sharp instance returning a promise
SharpImage.prototype.loadImage = function(imageData) {
  var self = this;
  return new Promise(function(resolve, reject) {
    if (!imageData) {
      return reject(new Error("Invalid image data"));
    }
    // load image into sharp
    self.sharpImage = sharp(imageData);
    return resolve();
  }).then(function() {
    return self.sharpImage.metadata().then(function(metadata) {
      self.metadata = metadata;
    });
  });
};

// resize the image returning the output
// this should not affect the current object
SharpImage.prototype.resizeImage = function(height, width, isSquare) {
  var self = this;
  if (!_.isNumber(height) || !_.isNumber(height)) {
    throw new Error("Not a valid resize request");
  }
  isSquare = isSquare || false;

  var resizeImg = self.sharpImage.clone()
    .resize(resize.width, resize.height)
    .interpolateWith(sharp.interpolator.nohalo);

  if (!resize.isSquare()) {
    // if not square - set max to use the longest matching length
    resizeImg.max();
  }
  return self.outputImage(resizeImg);
};

// batch resize returns a array of the resized images data
SharpImage.prototype.batchResize = function(resizes) {
  var self = this;
  if (!_.isArray(resizes) || resizes.length === 0) {
    throw new Error("Invalid batch resize options");
  }

  var resizePromises = [];
  resizes.forEach(function(resize) {
    resizePromises.push(self.resizeImage(resize.height, resize.width, resize.isSquare));
  });
  // retrun all promise to resize all
  return Promise.all(resizePromises);
};

// common output format for returning the image
SharpImage.prototype.outputImage = function(sharpImage, outputFormat) {
  var self = this;

  if (outputFormat) {
    outputFormat = self.isValidFormat(outputFormat);
  } else {
    outputFormat = self.getOutputFormat();
  }

  if (self.hasFormatChange(outputFormat)) {
    // convert the image format
    sharpImage.toFormat(outputFormat);
  }

  // keep metadast for image
  sharpImage.withMetadata();

  // returns promise
  return sharpImage.toBuffer()
    .then(function(imageBuffer) {
      return {
        format: outputFormat,
        image: imageBuffer,
      };
    });
};

// get a valid output format for the image
SharpImage.prototype.getOutputFormat = function(format) {
  // resize output only allows png or jpeg
  var outputFormat = this.defaultOutput;
  switch (this.metadata.format) {
    case "jpeg":
      outputFormat = "jpeg";
      break;
    case "png":
      outputFormat = "png";
      break;
  }
  return outputFormat;
};

// check if the output format  is valid
SharpImage.prototype.isValidFormat = function(format) {
  if (!this.validOutputFormats[format]) {
    throw new Error("Invalid output format: " + format);
  }
  return true;
};

SharpImage.prototype.reformatImage = function(format) {
  var outputFormat = format || self.defaultOutput;

  var sharpImage = self.sharpImage.clone();
  return self.outputImage(sharpImage, outputFormat);
};

// check if the format matched the original image format
SharpImage.prototype.hasFormatChange = function(format) {
  return (this.metadata.format != format);
};


module.exports = SharpImage;
