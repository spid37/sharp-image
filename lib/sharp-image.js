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
SharpImage.prototype.resizeImage = function(resize) {
  var self = this;

  resize = self.validResize(resize);

  var resizeImg = self.sharpImage.clone()
    .resize(resize.width, resize.height)
    .interpolateWith(sharp.interpolator.nohalo);

  if (!resize.isSquare) {
    // if not square - set max to use the longest matching length
    resizeImg.max();
  }
  return self.outputImage(resizeImg, null, resize.name);
};

SharpImage.prototype.validResize = function(resize) {
  if (!_.isNumber(resize.height) || !_.isNumber(resize.width)) {
    throw new Error("Not a valid resize request");
  }
  resize.isSquare = (resize.isSquare === true);

  resize.name = resize.name || null;

  return resize;
};

// batch resize returns a array of the resized images data
SharpImage.prototype.batchResize = function(resizes) {
  var self = this;
  if (!_.isArray(resizes) || resizes.length === 0) {
    throw new Error("Invalid batch resize options");
  }

  var resizePromises = [];
  resizes.forEach(function(resize) {
    resizePromises.push(self.resizeImage(resize));
  });
  // retrun all promise to resize all
  return Promise.all(resizePromises);
};

// common output format for returning the image
SharpImage.prototype.outputImage = function(sharpImage, outputFormat, imageName) {
  var self = this;

  imageName = imageName || null;

  return new Promise(function(resolve, reject) {
    if (outputFormat) {
      outputFormat = self.isValidFormat(outputFormat);
    } else {
      outputFormat = self.getOutputFormat();
    }

    if (self.hasFormatChange(outputFormat)) {
      // convert the image format
      sharpImage.toFormat(outputFormat);
    }

    // keep metadata for image
    sharpImage.withMetadata();

    // returns promise
    return sharpImage.toBuffer(function(err, imageBuffer, info) {
      if (err) reject(err);
      var output = {
        image: imageBuffer,
        info: info,
        name: imageName
      };
      resolve(output);
    });
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
  if (!_.includes(this.validOutputFormats, format)) {
    throw new Error("Invalid output format: " + format);
  }
  return format;
};

SharpImage.prototype.reformatImage = function(format) {
  var self = this;
  var outputFormat = format || self.defaultOutput;

  var sharpImage = self.sharpImage.clone();
  return self.outputImage(sharpImage, outputFormat);
};

// check if the format matched the original image format
SharpImage.prototype.hasFormatChange = function(format) {
  return (this.metadata.format != format);
};


module.exports = SharpImage;
