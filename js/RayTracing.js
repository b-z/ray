var RAY = {
	ctx: null,
	width: null,
	height: null,
	progress: null,
	basesize: null,
	coords: null,
	pause: null,
	timeout: null
};
//预处理时生成一个结果数组，
//加一个函数，输入progress，直接读数组返回xy
RAY.init = function(ctx, width, height, progress) {
	this.ctx = ctx;
	// this.ctx.lineWidth = 0;

	this.width = width;

	this.height = height;

	this.progress = progress;

	this.pause = false;

	this.timeout = 30;

	var tmp = Math.min(this.width, this.height);
	this.basesize = 1;
	while (this.basesize << 1 < tmp) {
		this.basesize <<= 1;
	}

	var filled = [];
	for (var i = 0; i < this.height; i++) {
		var tmp = [];
		for (var j = 0; j < this.width; j++) {
			tmp.push(false);
		}
		filled.push(tmp);
	}
	this.coords = [];
	var tmpc = [0, 0];
	var size = this.basesize;
	for (var i = 0; i < this.height * this.width; i++) {
		this.coords.push({
			x: tmpc[0],
			y: tmpc[1],
			size: size
		});

		filled[tmpc[1]][tmpc[0]] = true;
		while (size > 0 && filled[tmpc[1]][tmpc[0]] == true) {
			tmpc[0] += size;
			if (tmpc[0] >= this.width) {
				tmpc[0] = 0;
				tmpc[1] += size;
			}
			if (tmpc[1] >= this.height) {
				tmpc[1] = 0;
				size >>= 1;
			}
		}
	}
}

RAY.tracePixel = function(x, y) {
	return {
		r: Math.round(255 * x / this.width),
		g: Math.round(255 * y / this.height),
		b: Math.round(255 * Math.random()),
		a: 1
	}
}

RAY.traceCanvas = function(onprocess,onfinish) {
	var end = this.width * this.height;
	while (!this.pause && this.progress < end) {

		var coord = this.coords[this.progress];
		var c = RAY.tracePixel(coord.x, coord.y);
		var n = coord.size;
		this.coords[this.progress].color = this.ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + c.a + ')';
		this.ctx.fillRect(coord.x, coord.y, n, n);
		this.progress++;
		if (this.progress > 1 && this.coords[this.progress - 1].y != this.coords[this.progress - 2].y) {
			onprocess();
			setTimeout(function() {
				RAY.traceCanvas(onprocess,onfinish)
			}, this.timeout);
			break;
		}
	}
	if (this.progress == end) {
		onprocess();
		onfinish();
	}
}
