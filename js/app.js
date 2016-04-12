(function() {

	function hasGetUserMedia() {
		// Note: Opera builds are unprefixed.
		return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia || navigator.msGetUserMedia);
	}

	if (hasGetUserMedia()) {
		$("#info").hide();
		$("#message").show();
	} else {
		$("#info").show();
		$("#message").hide();
		$("#video-demo").show();
		$("#video-demo")[0].play();
		return;
	}

	var webcamError = function(e) {
		alert('Webcam error!', e);
	};

	var video = $('#webcam')[0];

	if (navigator.getUserMedia) {
		navigator.getUserMedia({video: true}, function(stream) {
			video.src = stream;
			start();
		}, webcamError);
	} else if (navigator.webkitGetUserMedia) {
		navigator.webkitGetUserMedia({video: true}, function(stream) {
			video.src = window.URL.createObjectURL(stream);
			start();
		}, webcamError);
	} else {
		//video.src = 'somevideo.webm'; // fallback.
	}


	var timeOut, lastImageData;
	var canvasSource = $("#canvas-source")[0];
	var canvasBlended = $("#canvas-blended")[0];

	var contextSource = canvasSource.getContext('2d');
	var contextBlended = canvasBlended.getContext('2d');

	var bufferLoader;


	// mirror video
	contextSource.translate(canvasSource.width, 0);
	contextSource.scale(-1, 1);

	var c = 5;

	function start() {
		$(canvasSource).show();
		$(canvasBlended).show();
		update();
	}

	function update() {
		drawVideo();
		blend();
		//checkAreas();
		timeOut = setTimeout(update, 1000/60);
	}

	function drawVideo() {
		contextSource.drawImage(video, 0, 0, video.width, video.height);
	}

	function blend() {
		var width = canvasSource.width;
		var height = canvasSource.height;
		// get webcam image data
		var sourceData = contextSource.getImageData(0, 0, width, height);
		// create an image if the previous image doesn’t exist
		if (!lastImageData) lastImageData = contextSource.getImageData(0, 0, width, height);
		// create a ImageData instance to receive the blended result
		var blendedData = contextSource.createImageData(width, height);
		// blend the 2 images
		differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);
		// draw the result in a canvas
		contextBlended.putImageData(blendedData, 0, 0);
		searchMovingPixels(width,height);

		// store the current webcam image
		lastImageData = sourceData;
		}

	function fastAbs(value) {
		// funky bitwise, equal Math.abs
		return (value ^ (value >> 31)) - (value >> 31);
	}

	function threshold(value) {
		return (value > 0x15) ? 0xFF : 0;
	}

	function difference(target, data1, data2) {
		// blend mode difference
		if (data1.length != data2.length) return null;
		var i = 0;
		while (i < (data1.length * 0.25)) {
			target[4*i] = data1[4*i] == 0 ? 0 : fastAbs(data1[4*i] - data2[4*i]);
			target[4*i+1] = data1[4*i+1] == 0 ? 0 : fastAbs(data1[4*i+1] - data2[4*i+1]);
			target[4*i+2] = data1[4*i+2] == 0 ? 0 : fastAbs(data1[4*i+2] - data2[4*i+2]);
			target[4*i+3] = 0xFF;
			++i;
		}
	}

	function differenceAccuracy(target, data1, data2) {
		if (data1.length != data2.length) return null;
		var i = 0;
		while (i < (data1.length * 0.25)) {
			var average1 = (data1[4*i] + data1[4*i+1] + data1[4*i+2]) / 3;
			var average2 = (data2[4*i] + data2[4*i+1] + data2[4*i+2]) / 3;
			var diff = threshold(fastAbs(average1 - average2));
			target[4*i] = diff;
			target[4*i+1] = diff;
			target[4*i+2] = diff;
			target[4*i+3] = 0xFF;
			++i;
		}
	}

	function checkAreas() {
		// loop over the note areas
		for (var r=0; r<8; ++r) {
			// get the pixels in a note area from the blended image
			
			var i = 0;
			var average = 0;
			// loop over the pixels
			while (i < (blendedData.data.length * 0.25)) {
				// make an average between the color channel
				average += (blendedData.data[i*4] + blendedData.data[i*4+1] + blendedData.data[i*4+2]) / 3;
				++i;
			}
			// calculate an average between of the color values of the note area
			average = Math.round(average / (blendedData.data.length * 0.25));
			if (average > 10) {
				
			}
		}
	}
	var raster = [];
	var whiteRasterCounter = 0;

	function searchMovingPixels(width, height){
		var rasterHeigth = height/10;
		var rasterWidth = width/10;
		raster = [rasterWidth];
		whiteRasterCounter = 0;

		for(x = 0; x< rasterWidth; x ++){
			raster[x] = raster[x] || [rasterHeigth];
			for(y = 0; y < rasterHeigth; y++){
				analyseRaster(x,y);
			}
		}
		
		console.log(whiteRasterCounter);

	}
	function analyseRaster(x,y){
		var rasterSizeX =  10;
		var rasterSizeY =  10;
		var pixelCounter = 0;
		
		// A Uint8ClampedArray representing a one-dimensional array containing the data in the RGBA order, with integer values between 0 and 255 (included).
		// it goes like this : [ 1st_Pixel_Red, 1st_Pixel_Green, 1st_Pixel_Blue, 1st_Pixel_Alpha, 2nd_Pixel_Red etc...
		var rasterPixels = contextBlended.getImageData(x*rasterSizeX,y*rasterSizeY,rasterSizeX,rasterSizeY);
		for (var i = 4*rasterSizeX * rasterSizeY; i >= 0; i--) {
			//RGB -> we only care about red!
			 if (rasterPixels.data[i*4] >100){
			 	pixelCounter++;
			 }
		}
		if(pixelCounter >20){
				raster[x][y] = true;
				whiteRasterCounter ++;
		}
		

	}


})();