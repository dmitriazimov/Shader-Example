
var app = app || {
    Objs: [],
    geometry: [],
    Idx: [],
    ObjCount: [],
	LightPosX: 0,
	LightPosY: 0,
	LightPosZ: 0,
	lightColor: "#999999",
	shininess: 150,
	Amb: [],
    Dif: [],
    Spec: [],
};

// buffer components
var buff = buff ||{
	vtxArray: [],
	idxArray: [],
	vtxCount: 0,
	indxCount: 0,
	vtxBuff: 0,
	idxBuff: 0,
	vtxIdx: 0,
	idxIdx: 0,
};

function calcNormals(vertices, ind){
  var x=0; 
  var y=1;
  var z=2;
	var v1 = [], v2 = [], thisNormal = [];

	// initialiser la liste des normales.
  var ns = [];
  for(var i=0;i<vertices.length;i++)
	{
    ns[i]=0.0;
  }

  for(var i=0;i<ind.length;i=i+3)
  {
    //v1 = p1 - p0
    v1[x] = vertices[3*ind[i+1]+x] - vertices[3*ind[i]+x];
    v1[y] = vertices[3*ind[i+1]+y] - vertices[3*ind[i]+y];
    v1[z] = vertices[3*ind[i+1]+z] - vertices[3*ind[i]+z];

    // v2 = p2 - p1
    v2[x] = vertices[3*ind[i+2]+x] - vertices[3*ind[i]+x];
    v2[y] = vertices[3*ind[i+2]+y] - vertices[3*ind[i]+y];
    v2[z] = vertices[3*ind[i+2]+z] - vertices[3*ind[i]+z];            

    // N = v2 x v1 (cross product).
    thisNormal[x] = v1[y]*v2[z] - v1[z]*v2[y];
    thisNormal[y] = v1[z]*v2[x] - v1[x]*v2[z];
    thisNormal[z] = v1[x]*v2[y] - v1[y]*v2[x];

    for(j=0;j<3;j++)
	{
			// N += thisNormal. on additionne les normales. 
      ns[3*ind[i+j]+x] =  ns[3*ind[i+j]+x] + thisNormal[x];
      ns[3*ind[i+j]+y] =  ns[3*ind[i+j]+y] + thisNormal[y];
      ns[3*ind[i+j]+z] =  ns[3*ind[i+j]+z] + thisNormal[z];
    }
  }

  // Normalisation.
  for(var i=0;i<vertices.length;i=i+3){ 

    var nn=[];
		var len = 0;
		for(var j = 0; j < 3; j++)
		{
			nn[j] = ns[i+j];
			len += nn[j] * nn[j];
		}

		// La norme de la normale.
		len = Math.sqrt(len);
    if (len == 0) 
			len = 0.00001;

		for(var j = 0; j < 3; j++)
    	ns[i+j] = nn[j] / len;

		//console.log(len);
  }

  return ns;
};

app.camera = {
    azimuth: 0,
    elevation: 0,
    trans: [0, 0, 0],

    vMatrix: mat4.create(),
    pMatrix: mat4.create(),

    rotate: function (a, e) {
        this.elevation += e;
        this.azimuth += a;

        if (this.azimuth > 360 || this.azimuth < -360) {
            this.azimuth = this.azimuth % 360;
        }

        if (this.elevation > 360 || this.elevation < -360) {
            this.elevation = this.elevation % 360;
        }
    },

    getViewMatrix: function () {
        mat4.identity(this.vMatrix);
        mat4.rotateX(this.vMatrix, this.vMatrix, this.elevation * Math.PI / 180);
        mat4.rotateY(this.vMatrix, this.vMatrix, this.azimuth * Math.PI / 180);
        mat4.translate(this.vMatrix, this.vMatrix, this.trans);
        mat4.invert(this.vMatrix, this.vMatrix);

        return this.vMatrix;
    }
};


function loadJSON(id, filename) {
    var request = new XMLHttpRequest();
    request.open("GET", filename);

    request.onreadystatechange = function () {
        if (request.readyState == XMLHttpRequest.DONE) {
            if (request.status == 404)
                console.info(filename + " does not exist");
            else {
                var obj = JSON.parse(request.responseText);
                obj.id = id || "none";

                handleObject(obj);
            }
        }
    }
    request.send();
}

function handleObject(obj) {
    app.Objs.push(obj);

    if (app.Objs.length == 4) {
		
		countIdxVtx();
        initBuffers();
        assignNormalsAndSetAmbDifSpec();
		handleBuffers();

        draw();
    }
}

function initGeometry() {
    loadJSON("Plane", "models/plane.json");
    loadJSON("Cone", "models/cone.json");
    loadJSON("Light", "models/light.json");
    loadJSON("SmallSphere", "models/smallsph.json");
}

function getGLContext(canvasId) {
    var c = document.getElementById(canvasId);
    var ctx = null;

    ctx = c.getContext("webgl");

    return [c, ctx];
}

function init() {

	getElements();
	
    [app.canvas, app.gl] = getGLContext("can");

    app.mousePressed = false;
    app.canvas.addEventListener("mousedown", mouseDown, false);
    app.canvas.addEventListener("mouseup", mouseUp, false);
    app.canvas.addEventListener("mousemove", mouseMove, false);

    var ar = app.canvas.width / app.canvas.height;

    mat4.perspective(app.camera.pMatrix, Math.PI / 2.0, ar, 0.1, 100);

    app.camera.azimuth = 0;
    app.camera.elevation = 0;
    app.camera.trans = [0, 0, 10];

    app.mMatrix = mat4.create();
    mat4.identity(app.mMatrix);

    initGL();
    initGeometry();

}

function getElements()
{
	document.getElementById("sliderX").value=app.LightPosX;
	document.getElementById('valueX').innerHTML=" "+app.LightPosX;
	document.getElementById("sliderY").value=app.LightPosY;
	document.getElementById('valueY').innerHTML=" "+app.LightPosY;
	document.getElementById("sliderZ").value=app.LightPosZ;
	document.getElementById('valueZ').innerHTML=" "+app.LightPosZ;
	document.getElementById("sliderS").value=app.shininess;
	document.getElementById('valueS').innerHTML=" "+app.shininess;
}


function assignNormalsAndSetAmbDifSpec()
{
	for(var obj of app.Objs) {
			var normals=calcNormals(obj.vertices, obj.indices);
			
            for (var index = 0; index < obj.vertices.length; index+=3) {
                vtxArray[index * 2 + vtxIdx * 2 + 0] = obj.vertices[index + 0];
                vtxArray[index * 2 + vtxIdx * 2 + 1] = obj.vertices[index + 1];
                vtxArray[index * 2 + vtxIdx * 2 + 2] = obj.vertices[index + 2];
                vtxArray[index * 2 + vtxIdx * 2 + 3] = normals[index + 0];
                vtxArray[index * 2 + vtxIdx * 2 + 4] = normals[index + 1];
                vtxArray[index * 2 + vtxIdx * 2 + 5] = normals[index + 2];
            }
			
            for (var index = 0; index < obj.indices.length; index++) {
                idxArray[indicesIndex + index] = obj.indices[index]+vtxIdx/3;
            }
			
            app.Idx.push(indicesIndex);
            app.ObjCount.push(obj.indices.length);
			
			var colAmb=vec4.create();
			colAmb[0]=obj.ambient[0]; colAmb[1]=obj.ambient[1]; colAmb[2]=obj.ambient[2]; colAmb[3]=obj.ambient[3];
			app.Amb.push(colAmb);
			
			var colDif=vec4.create();
			colDif[0]=obj.diffuse[0]; colDif[1]=obj.diffuse[1]; colDif[2]=obj.diffuse[2]; colDif[3]=obj.diffuse[3];
			app.Dif.push(colDif);
			
			var colSpec=vec4.create();
			colSpec[0]=obj.specular[0]; colSpec[1]=obj.specular[1]; colSpec[2]=obj.specular[2]; colSpec[3]=obj.specular[3];
			app.Spec.push(colSpec);
			
            vtxIdx += obj.vertices.length;
            indicesIndex += obj.indices.length;
        }
}

function countIdxVtx()
{
	vtxCount = 0;
	indxCount = 0;
	for(var obj of app.Objs) {
		vtxCount += obj.vertices.length;
		indxCount += obj.indices.length;
	}
}

function initBuffers()
{
	vtxArray = new Float32Array(vtxCount*2);
	verticesBuffer = app.gl.createBuffer();
	app.gl.bindBuffer(app.gl.ARRAY_BUFFER, verticesBuffer);
	app.gl.bufferData(app.gl.ARRAY_BUFFER, vtxArray.BYTES_PER_ELEMENT * vtxArray.length, app.gl.STATIC_DRAW);

	idxArray = new Uint16Array(indxCount);
	indicesBuffer = app.gl.createBuffer();
	app.gl.bindBuffer(app.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
	app.gl.bufferData(app.gl.ELEMENT_ARRAY_BUFFER, idxArray.BYTES_PER_ELEMENT * idxArray.length, app.gl.STATIC_DRAW);

	vtxIdx = 0;
	indicesIndex = 0;
}

function handleBuffers()
{
	app.gl.bufferSubData(app.gl.ARRAY_BUFFER, 0, vtxArray);
	app.gl.bufferSubData(app.gl.ELEMENT_ARRAY_BUFFER, 0, idxArray);

	app.gl.enableVertexAttribArray(app.posLoc);
	app.gl.vertexAttribPointer(app.posLoc, 3, app.gl.FLOAT, false, 24, 0);
	app.gl.enableVertexAttribArray(app.normalLoc);
	app.gl.vertexAttribPointer(app.normalLoc, 3, app.gl.FLOAT, false, 24, 12);
}

function initGL() 
{
    app.gl.viewport(0, 0, app.gl.canvas.width, app.gl.canvas.height);

    app.gl.clearColor(0.5, 0.5, 0.5, 1);
    app.gl.clear(app.gl.COLOR_BUFFER_BIT);

    var vsScript = document.getElementById("vs-src");
    var fsScript = document.getElementById("fs-src");
    var progObject = createProgram(app.gl, vsScript.text, fsScript.text);

    app.gl.useProgram(progObject);
    app.program = progObject;
	
	getUniforms();
	getAttributes();
	setMatrices();

    app.gl.enable(app.gl.DEPTH_TEST);
}

function setMatrices()
{
	app.gl.uniformMatrix4fv(app.pmatLoc, false, app.camera.pMatrix);
	app.gl.uniformMatrix4fv(app.vmatLoc, false, app.camera.getViewMatrix());
	app.gl.uniformMatrix4fv(app.mmatLoc, false, app.mMatrix);
	app.gl.uniformMatrix4fv(app.nmatLoc, false, app.mMatrix);
}

function getUniforms()
{
	app.pmatLoc = app.gl.getUniformLocation(app.program, 'pMatrix');
    app.vmatLoc = app.gl.getUniformLocation(app.program, 'vMatrix');
    app.mmatLoc = app.gl.getUniformLocation(app.program, 'mMatrix');
    app.nmatLoc = app.gl.getUniformLocation(app.program, 'nMatrix');
	app.shininessLoc = app.gl.getUniformLocation(app.program, 'shininess');
    app.KambLoc = app.gl.getUniformLocation(app.program, 'Kamb');
    app.KdifLoc = app.gl.getUniformLocation(app.program, 'Kdif');
    app.KspecLoc = app.gl.getUniformLocation(app.program, 'Kspec');
	app.LightPos = app.gl.getUniformLocation(app.program, 'lightPosition');
	app.LightCol = app.gl.getUniformLocation(app.program, 'lightColor');
}

function getAttributes()
{
	app.posLoc = app.gl.getAttribLocation(app.program, 'position');
    app.normalLoc = app.gl.getAttribLocation(app.program, 'normal');
}

function loadShader(gl, type, srcString) 
{
    var shaderObj = gl.createShader(type);
    gl.shaderSource(shaderObj, srcString);
    gl.compileShader(shaderObj);
    var ok = gl.getShaderParameter(shaderObj, gl.COMPILE_STATUS);

    return shaderObj;
}

function createProgram(gl, vsSource, fsSource) 
{
	
    var vsObject = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    var fsObject = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
	
    var progObject = gl.createProgram();
    if (!progObject) {
        alert("Can't create GL program");
        return null;
    }

    gl.attachShader(progObject, vsObject);
    gl.attachShader(progObject, fsObject);

    gl.linkProgram(progObject);
    var ok = gl.getProgramParameter(progObject, gl.LINK_STATUS);

    return progObject;
}

function mouseUp(event) {
    app.mousePressed = false;
}

function mouseMove(event) {
    app.lastX = app.mouseX;
    app.lastY = app.mouseY;
    app.mouseX = event.clientX;
    app.mouseY = event.clientY;

    if (!app.mousePressed)
        return;

    var dx = app.mouseX - app.lastX;
    var dy = app.mouseY - app.lastY;

    var factAzimuth = -200.0 / app.canvas.height;
    var factElev = -200.0 / app.canvas.width;

    app.camera.rotate(dx * factAzimuth, dy * factElev);
}

function mouseDown(event) {
    app.mousePressed = true;

    app.mouseX = event.clientX;
    app.mouseY = event.clientY;
}

function assignAmbDifSpecCoefficients()
{
    for (var i = 0; i < app.Idx.length; i++) {
		app.gl.uniform4fv(app.KambLoc, app.Amb[i]);
		app.gl.uniform4fv(app.KdifLoc, app.Dif[i]);
		app.gl.uniform4fv(app.KspecLoc, app.Spec[i]);
        app.gl.drawElements(app.gl.TRIANGLES, app.ObjCount[i], app.gl.UNSIGNED_SHORT, app.Idx[i] * 2);
    }
}

function adjustLightColor()
{
	var lightRGB=vec4.create();
	lightRGB[0]=1;
	lightRGB[1]=1;
	lightRGB[2]=1;
	lightRGB[3]=1;
	app.gl.uniform4fv(app.LightCol, lightRGB);
}

function setLightPosition()
{
	var LightPosXYZ=vec3.create();
	LightPosXYZ[0]=app.LightPosX;
	LightPosXYZ[1]=app.LightPosY;
	LightPosXYZ[2]=app.LightPosZ;
	app.gl.uniform3fv(app.LightPos, LightPosXYZ);
}

function draw(time) {
    app.gl.clear(app.gl.COLOR_BUFFER_BIT | app.gl.DEPTH_BUFFER_BIT);
	
    var viewMatrix = app.camera.getViewMatrix();
    app.gl.uniformMatrix4fv(app.vmatLoc, false, viewMatrix);
	app.gl.uniform1f(app.shininessLoc, app.shininess);
	adjustLightColor();
	assignAmbDifSpecCoefficients();
	setLightPosition();
	
    requestAnimationFrame(draw);
}