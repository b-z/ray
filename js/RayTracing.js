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
    maxRecursionDepth: null,
    num_samples: null
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

    this.num_samples = $('#samplersize').val() - 0;

    this.lens_size = $('#lenssize').val() - 0;

    this.light_size = $('#lightsize').val() - 0;

    this.focal_distance = $('#focal').val() - 0;

    this.recursion_depth = $('#recursion').val() - 0;

    this.reflect_strength = $('#reflect').val() - 0;

    this.reflect_diffusion = $('#reflect_d').val() - 0;

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
    console.log(this.cameraNormalMatrix);
    this.perspective = 0.5 / Math.tan(THREE.Math.degToRad(camera.fov * 0.5)) * this.height;
    this.objects = scene.children;

    this.num_samples = $('#samplersize').val() - 0;

    this.lens_size = $('#lenssize').val() - 0;

    this.light_size = $('#lightsize').val() - 0;

    this.focal_distance = $('#focal').val() - 0;

    this.recursion_depth = $('#recursion').val() - 0;

    this.reflect_strength = $('#reflect').val() - 0;

    this.reflect_diffusion = $('#reflect_d').val() - 0;

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

// with lens
RAY.tracePixel = function(x, y) {
    var origin = new THREE.Vector3();
    var outputColor = new THREE.Color(0, 0, 0);
    var num_samples = this.num_samples;
    var num_samples2 = Math.pow(num_samples, 2);
    for (var n = 0; n < num_samples2; n++) {
        var color = new THREE.Color(0, 0, 0);
        origin.copy(this.camera.position);
        // 抖动采样
        x0 = x - 0.5 + Math.random() / num_samples + n % num_samples / num_samples;
        y0 = y - 0.5 + Math.random() / num_samples + Math.floor(n / num_samples) / num_samples;

        var pp = [x0 - this.width / 2, y0 - this.height / 2]; //sample point on a pixel
        var tmp = Math.random() * Math.PI * 2;
        //var lens_radius = 0.0 * Math.random();
        var lens_radius = this.lens_size * Math.random();
        var lp = [lens_radius * Math.cos(tmp), lens_radius * Math.sin(tmp)];
        origin.x += lp[0];
        origin.y += lp[1];

        lp[0] *= Math.cos(Math.atan2(camera.position.x, camera.position.z));
        lp[1] *= 1;
        //ray direction
        var f = this.focal_distance; //focal plane distance
        var d = this.perspective; //view plane distance
        var direction = new THREE.Vector3(pp[0] * f / d - lp[0], pp[1] * f / d - lp[1], -f);
        direction.applyMatrix3(this.cameraNormalMatrix); //.normalize();
        direction.normalize();
        this.spawnRay(origin, direction, color, 0, n, num_samples);
        if (color.r > 1) color.r = 1;
        if (color.g > 1) color.g = 1;
        if (color.b > 1) color.b = 1;
        outputColor.add(color);
    }
    outputColor.r /= num_samples2;
    outputColor.g /= num_samples2;
    outputColor.b /= num_samples2;
    outputColor.copyLinearToGamma(outputColor);

    return {
        r: Math.round(255 * outputColor.r),
        g: Math.round(255 * outputColor.g),
        b: Math.round(255 * outputColor.b),
        a: 1
    }
}


/*
//without lens
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
*/

RAY.spawnRay = function(origin, direction, color, recursionDepth, n, num_samples) {
    var intersections = this.raycasting(origin, direction);
    if (intersections.length == 0) {
        return;
    }
    var first = intersections[0];

    /*if (recursionDepth >= 1) {
        // color.r = color.g = color.b = first.distance;
        if (first.distance <= 0.0000000001) {
            if (intersections.length > 1) {
                first = intersections[1];
                // color.r = color.g = color.b = first.distance;
            }
        }
        // return;
    }*/
    var object = first.object;
    // var cacheobject = this.objcache[object.id];
    var material = object.material;
    var diffuseColor = new THREE.Color(0, 0, 0);
    try {
        // diffuseColor.copy(object.material.color);
        diffuseColor.copyGammaToLinear(object.material.color);
    } catch (e) {
        diffuseColor.set(0, 0, 0);
        console.warn("set diffuseColor fail");
    }

    // var normalComputed = false;
    var normalVector = new THREE.Vector3();

    var rayLightOrigin = new THREE.Vector3();
    rayLightOrigin.copy(first.point);
    var rayLightDirection = new THREE.Vector3();

    // 抖动采样
    var x0 = (n != undefined) ? (-0.5 + Math.random() / num_samples + n % num_samples / num_samples) : 0;
    var y0 = (n != undefined) ? (-0.5 + Math.random() / num_samples + Math.floor(n / num_samples) / num_samples) : 0;

    // var localPoint=new THREE.Vector3();
    // localPoint.copy(first.point).applyMatrix4(cacheobject.inverseMatrix);

    var eyeVector = new THREE.Vector3();
    eyeVector.subVectors(origin, first.point).normalize();

    var halfVector = new THREE.Vector3();
    var specularColor = new THREE.Color(0, 0, 0);
    var schlick = new THREE.Color(0, 0, 0);

    for (var i = 0; i < this.lights.length; i++) {
        var lightVector = new THREE.Vector3();
        lightVector.setFromMatrixPosition(this.lights[i].matrixWorld);
        //console.log(lightVector);
        var lightSize = this.light_size;
        lightVector.x += x0 * lightSize;
        lightVector.z += y0 * lightSize;
        //lightVector.x+=(Math.random()-0.5)*lightSize;
        //lightVector.z+=(Math.random()-0.5)*lightSize;
        var distance = lightVector.distanceTo(first.point);

        var lightPosition = new THREE.Vector3();
        lightPosition.copy(lightVector);
        lightVector.sub(first.point);

        rayLightDirection.copy(lightVector).normalize();
        rayLightDirection.multiplyScalar(-1);
        var lightIntersections = this.raycasting(lightPosition, rayLightDirection, 0, distance - 0.00000001);

        ////// DEBUG
        // if (lightIntersections.length){
        // 	distance=lightPosition.distanceTo(lightIntersections[0].point);
        // }
        // color.r=lightIntersections.length/3;

        if (lightIntersections.length) {
            continue;
        }
        if (material instanceof THREE.MeshBasicMaterial) {
            var white = new THREE.Color(1, 1, 1);
            color.add(white);
        }
        if (first.object.normal == undefined) {
            normalVector.copy(first.face.normal);
        } else {
            normalVector.copy(first.object.normal);
        }
        //console.log(first);
        var r = lightVector.length(); // / 1.2;
        var attenuation = 1.0 / (r * r); //(lightVector.length() * lightVector.length());
        lightVector.normalize();

        var dot = Math.max(normalVector.dot(lightVector), 0);
        //var dot = Math.abs(normalVector.dot(lightVector));
        //console.log(dot);
        var diffuseIntensity = dot * this.lights[i].intensity;
        // console.log(diffuseIntensity);

        var lightColor = new THREE.Color(0, 0, 0);
        lightColor.copyGammaToLinear(this.lights[i].color);
        // lightColor.copy(this.lights[i].color);

        var lightContribution = new THREE.Color(0, 0, 0);
        lightContribution.copy(diffuseColor);
        lightContribution.multiply(lightColor);
        lightContribution.multiplyScalar(diffuseIntensity * attenuation);

        color.add(lightContribution);
        if (material instanceof THREE.MeshPhongMaterial && first.object.normal == undefined) {
            halfVector.addVectors(lightVector, eyeVector).normalize();

            var dotNormalHalf = Math.max(normalVector.dot(halfVector), 0.0);
            var specularIntensity = Math.max(Math.pow(dotNormalHalf, material.shininess), 0.0) * diffuseIntensity;

            var specularNormalization = (material.shininess + 2.0) / 8.0;

            // specularColor.copy(material.specular);
            specularColor.copyGammaToLinear(material.specular);

            var alpha = Math.pow(Math.max(1.0 - lightVector.dot(halfVector), 0.0), 5.0);

            schlick.r = specularColor.r + (1.0 - specularColor.r) * alpha;
            schlick.g = specularColor.g + (1.0 - specularColor.g) * alpha;
            schlick.b = specularColor.b + (1.0 - specularColor.b) * alpha;

            lightContribution.copy(schlick);

            lightContribution.multiply(lightColor);
            lightContribution.multiplyScalar(specularNormalization * specularIntensity * attenuation);
            color.add(lightContribution);
        }
    }

    // 反射
    var tmpColor = new THREE.Color(0, 0, 0);

    if (first.object.normal == undefined) {
        normalVector.copy(first.face.normal);
    } else {
        normalVector.copy(first.object.normal);
    }
    if (recursionDepth < this.recursion_depth) {
        var reflectVector = new THREE.Vector3();
        reflectVector.copy(direction);
        var r = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        r.normalize();
        r.multiplyScalar(this.reflect_diffusion);
        normalVector.add(r);
        normalVector.normalize();
        reflectVector.reflect(normalVector);

        // color.r = (reflectVector.x + 1) / 2;
        // color.g = (reflectVector.y + 1) / 2;
        // color.b = (reflectVector.z + 1) / 2;
        // return;
        var theta = Math.max(eyeVector.dot(normalVector), 0.0);
        var rf0 = this.reflect_strength;
        var fresnel = rf0 + (1.0 - rf0) * Math.pow((1.0 - theta), 5.0);
        var weight = fresnel;
        // console.log(fresnel);
        var zColor = tmpColor; //[recursionDepth];
        RAY.spawnRay(first.point, reflectVector, zColor, recursionDepth + 1, n, num_samples);

        // RAY.spawnRay(first.point, reflectVector, color, recursionDepth + 1, n, num_samples);
        // return;
        if (material instanceof THREE.MeshPhongMaterial) {
            zColor.multiply(material.color);
        }

        // console.log(zColor);
        // zColor.copyGammaToLinear(zColor);
        // console.log(color, zColor);
        zColor.multiplyScalar(weight);
        color.multiplyScalar(1 - weight);
        color.add(zColor);
    }
    // console.log(color);
    // color.copyLinearToGamma(color);
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
