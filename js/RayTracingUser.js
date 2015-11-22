var canv, ctx, file;
$(document).ready(function() {
	// $('.materialboxed').materialbox();
	canv = $('#canv')[0];
	ctx = canv.getContext('2d');
	file = $('#file')[0];
	RAY.init(ctx, canv.width, canv.height, 0);
	file.onchange = function(event) {
		var selectedFile = event.target.files[0];
		var reader = new FileReader();
		reader.onload = putImage2Canvas;
		reader.readAsDataURL(selectedFile);
	}
	$('#objlayer').width($('#raylayer').width());
	$('#objlayer').height($('#raylayer').height());
	$('#raylayer').hide();
	$('select').material_select();
	startRendering();
});

function putImage2Canvas(event) {
	var img = new Image();
	img.src = event.target.result;
	img.onload = function() {
		canv.width = img.width;
		canv.height = img.height;
		ctx = canv.getContext('2d');
		ctx.drawImage(img, 0, 0);
		RAY.init(ctx, img.width, img.height, window.localStorage.RAYprogress);
		onprocess();
	}
}

var onprocess = function() {
	$('.determinate').css('width', 100 * RAY.progress / (RAY.width * RAY.height) + '%');
	if (RAY.progress) {
		$('[id^=doge]').css('top', $('#canv').height() * RAY.coords[RAY.progress - 1].y / RAY.height - 20 + 'px');
	} //bug fix
}

var onfinish = function() {
	setTimeout(function() {
		$('.progress').css('display', 'none');
		$('[id^=doge]').css('display', 'none');
		Materialize.toast('Finish!', 1000);
	}, 1000);
}

function startTracing() {
	RAY.pause = false;
	$('.progress').css('display', 'block');
	$('[id^=doge]').css('display', 'block');
	RAY.traceCanvas(onprocess, onfinish);
	// setInterval(function(){RAY.traceCanvas();},100);
}

function pause() {
	RAY.pause = true;
}

function saveProgress() {
	//还应该存储模型的方位等信息
	var type = 'image/png';
	var imgsrc = canv.toDataURL(type).replace(type, "image/octet-stream");
	var img = new Image();
	img.src = imgsrc;
	window.location.href = imgsrc;

	var storage = window.localStorage;
	if (!storage.getItem("RAYprogress")) {
		storage.setItem("RAYprogress", 0);
	}
	storage.RAYprogress = RAY.progress;
}

// function loadProgress() {
//
// 	// RAY.init(ctx, width,height,window.localStorage.RAYprogress);
// }
