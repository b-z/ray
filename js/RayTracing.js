var RAY = {
	ctx: null,
	width: null,
	height: null,
	progress: null,
	basesize: null,
	coords: null,
	pause: null,
	timeout: null,
	scene: null,
	camera: null,
	perspective: null,
	cameraNormalMatrix: null,
	objects: null,
	lights: null,
	objcache: null,
	maxRecursionDepth: null
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

	this.timeout = 15;

	this.lights = [];

	this.objcache = {};

	this.maxRecursionDepth = 5;

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

RAY.initScene = function(scene, camera) {
	this.scene = scene;
	this.camera = camera;
	this.cameraNormalMatrix = new THREE.Matrix3();
	// console.log(camera.matrixWorld);
	this.cameraNormalMatrix.getNormalMatrix(this.camera.matrixWorld);
	this.perspective = 0.5 / Math.tan(THREE.Math.degToRad(camera.fov * 0.5)) * this.height;
	this.objects = scene.children;
	var scope = this;
	scene.traverse(function(object) {
		if (object instanceof THREE.Light) {
			if (object.type == "PointLight") {
				scope.lights.push(object);
			}
		}
		if (scope.objcache[object.id] === undefined) {
			scope.objcache[object.id] = {
				normalMatrix: new THREE.Matrix3(),
				inverseMatrix: new THREE.Matrix4()
			};
		}
		var modelViewMatrix = new THREE.Matrix4();
		modelViewMatrix.multiplyMatrices(scope.camera.matrixWorldInverse, object.matrixWorld);

		var _object = scope.objcache[object.id];

		_object.normalMatrix.getNormalMatrix(modelViewMatrix);
		_object.inverseMatrix.getInverse(object.matrixWorld);
	});
}

RAY.traceCanvas = function(onprocess, onfinish) {
	var end = this.width * this.height;
	while (!this.pause && this.progress < end) {

		var coord = this.coords[this.progress];
		var c = RAY.tracePixel(coord.x, this.height - coord.y);
		var n = coord.size;
		this.coords[this.progress].color = this.ctx.fillStyle = 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + c.a + ')';
		this.ctx.fillRect(coord.x, coord.y, n, n);
		this.progress++;
		if (this.progress > 1 && this.coords[this.progress - 1].y != this.coords[this.progress - 2].y) {
			onprocess();
			setTimeout(function() {
				RAY.traceCanvas(onprocess, onfinish)
			}, this.timeout);
			break;
		}
	}
	if (this.progress == end) {
		onprocess();
		onfinish();
	}
}

RAY.tracePixel = function(x, y) {
	var origin = new THREE.Vector3();
	origin.copy(this.camera.position);
	x += Math.random() - 0.5;
	y += Math.random() - 0.5;
	var direction = new THREE.Vector3(x - this.width / 2, y - this.height / 2, -this.perspective);
	direction.applyMatrix3(this.cameraNormalMatrix).normalize();

	var outputColor = new THREE.Color(0, 0, 0);
	this.spawnRay(origin, direction, outputColor, 0);

	return {
		r: Math.round(255 * outputColor.r),
		g: Math.round(255 * outputColor.g),
		b: Math.round(255 * outputColor.b),
		a: 1
	}
}

RAY.spawnRay = function(origin, direction, color, recursionDepth) {
	var intersections = this.raycasting(origin, direction);
	if (intersections.length == 0) {
		return;
	}
	var first = intersections[0];
	var object = first.object;

	var diffuseColor = new THREE.Color(0, 0, 0);
	try {
		diffuseColor.copyGammaToLinear(object.material.color);
	} catch (e) {
		diffuseColor.set(0, 0, 0);
		console.warn("set diffuseColor fail");
	}

	var rayLightOrigin = new THREE.Vector3();
	rayLightOrigin.copy(first.point);
	var rayLightDirection = new THREE.Vector3();

	for (var i = 0; i < this.lights.length; i++) {
		var lightVector = new THREE.Vector3();
		lightVector.setFromMatrixPosition(this.lights[i].matrixWorld);
		var distance = lightVector.distanceTo(first.point);

		var lightPosition=new THREE.Vector3();
		lightPosition.copy(lightVector);

		lightVector.sub(first.point);
		rayLightDirection.copy(lightVector).normalize();
		rayLightDirection.multiplyScalar(-1);
		var lightIntersections = this.raycasting(lightPosition, rayLightDirection, 0, distance-0.00000001);

		////// DEBUG
		// if (lightIntersections.length){
		// 	distance=lightPosition.distanceTo(lightIntersections[0].point);
		// }
		// color.r=lightIntersections.length/3;

		if (lightIntersections.length) {
			continue;
		}
		color.add(diffuseColor);
	}
}

RAY.raycasting = function(origin, direction, near, far) {
	var raycaster = new THREE.Raycaster(origin, direction);
	if (near != undefined && far != undefined) {
		raycaster.near = near;
		raycaster.far = far;
	}
	return raycaster.intersectObjects(this.objects, true);
}

RAY.reflecting = function() {

}

RAY.mixColor = function() {

}
