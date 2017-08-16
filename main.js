// Based on
// https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html

MAIN = {};


(function() {


let controlsEnabled = false;
const blocker = document.getElementById( 'blocker' );
const instructions = document.getElementById( 'instructions' );

const havePointerLock = 'pointerLockElement' in document ||
                        'mozPointerLockElement' in document ||
                        'webkitPointerLockElement' in document;

// Check if browser supports Pointer Lock API.
if (havePointerLock) {
  const element = document.body;
  const pointerlockchange = function (event) {
    if (document.pointerLockElement === element ||
        document.mozPointerLockElement === element ||
        document.webkitPointerLockElement === element ) {
      controlsEnabled = true;
      controls.enabled = true;
      blocker.style.display = 'none';
    } else {
      controls.enabled = false;
      blocker.style.display = '-webkit-box';
      blocker.style.display = '-moz-box';
      blocker.style.display = 'box';
      instructions.style.display = '';
    }
  }
  const pointerlockerror = function (event) {
    instructions.style.display = '';
  }

  // Hook pointer lock state change events
  document.addEventListener( 'pointerlockchange', pointerlockchange, false );
  document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
  document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
  document.addEventListener( 'pointerlockerror', pointerlockerror, false );
  document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
  document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

  instructions.addEventListener('click', function (event) {
    instructions.style.display = 'none';

    // Ask the browser to lock the pointer.
    element.requestPointerLock = element.requestPointerLock ||
                                 element.mozRequestPointerLock ||
                                 element.webkitRequestPointerLock;
    element.requestPointerLock();
  }, false);
} else {
  instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}

const camera = new THREE.PerspectiveCamera(80, window.innerWidth/window.innerHeight, 1, 2000 * 1000);
const scene = new THREE.Scene();
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
const controls = new THREE.PointerLockControls(camera);
const renderer = new THREE.WebGLRenderer();
MAIN.camera = camera;
MAIN.scene = scene;
MAIN.controls = controls;
MAIN.WATER_Y = -50;


let prevTime = performance.now();

let water;
let skyBox;

function init () {
  const SKY_COLOR = 0xD9CAB2; // based on skybox
  scene.fog = new THREE.Fog(SKY_COLOR, HEIGHTMAP.CHUNK_SIZE*0.6, HEIGHTMAP.CHUNK_SIZE);
  scene.add(controls.getObject());
  renderer.setClearColor(SKY_COLOR);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  PLAYER.setUpControls();
  window.addEventListener('resize', onWindowResize, false);

  // Directional light.
  dirLight.position.set( -1, 1.75, -1 );
  dirLight.position.multiplyScalar( 50 );
  scene.add( dirLight );
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = dirLight.shadow.mapSize.height = 512;
  dirLight.shadow.camera.fov = 120;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 3000;
  var d = HEIGHTMAP.CHUNK_SIZE * 1.4;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.far = 3500;
  dirLight.shadow.bias = 0.0001;
  MAIN.scene.add(dirLight.target);

  dirLight2 = new THREE.DirectionalLight(0xffffff, 1);
  dirLight2.position.set(-1, 1.75, 1);
  scene.add(dirLight2);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  // MAIN.scene.add(ambientLight);

  // Box.
  const boxMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
  });
  const boxGeometry = new THREE.BoxGeometry(1, 2, 1);
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.castShadow = true;
  scene.add(box);


  // skybox

  var cubeMap = new THREE.CubeTexture( [] );
  cubeMap.format = THREE.RGBFormat;

  var loader = new THREE.ImageLoader();
  loader.load( 'assets/textures/skyboxsun25degtest.png', function ( image ) {

    var getSide = function ( x, y ) {

      var size = 1024;

      var canvas = document.createElement( 'canvas' );
      canvas.width = size;
      canvas.height = size;

      var context = canvas.getContext( '2d' );
      context.drawImage( image, - x * size, - y * size );

      return canvas;

    };

    cubeMap.images[ 0 ] = getSide( 2, 1 ); // px
    cubeMap.images[ 1 ] = getSide( 0, 1 ); // nx
    cubeMap.images[ 2 ] = getSide( 1, 0 ); // py
    cubeMap.images[ 3 ] = getSide( 1, 2 ); // ny
    cubeMap.images[ 4 ] = getSide( 1, 1 ); // pz
    cubeMap.images[ 5 ] = getSide( 3, 1 ); // nz
    cubeMap.needsUpdate = true;

  } );
  var cubeShader = THREE.ShaderLib[ 'cube' ];
  cubeShader.uniforms[ 'tCube' ].value = cubeMap;

  var skyBoxMaterial = new THREE.ShaderMaterial( {
    fragmentShader: cubeShader.fragmentShader,
    vertexShader: cubeShader.vertexShader,
    uniforms: cubeShader.uniforms,
    //depthWrite: false,
    side: THREE.BackSide,
    fog: false
  } );

  skyBox = new THREE.Mesh(
    new THREE.BoxGeometry( 1900*1000, 1900*1000, 1900*1000 ),
    skyBoxMaterial
  );

  scene.add( skyBox );

  waterNormals = new THREE.TextureLoader().load( 'assets/textures/waternormals.jpg' );
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
  waterNormals.repeat.set(16, 16);
  waterMat = new THREE.MeshPhongMaterial({
    color: 0x8888aa,
    specular: 0x666666,
    normalMap: waterNormals,
    normalScale: new THREE.Vector2(0.2, 0.2),
    shininess: 100,
    reflectivity: 0.6,
    depthWrite: false,
    envMap: cubeMap,
  });
  waterPlane = new THREE.PlaneGeometry(HEIGHTMAP.CHUNK_SIZE * 2.5, HEIGHTMAP.CHUNK_SIZE * 2.5);
  water = new THREE.Mesh(waterPlane,  waterMat);
  water.rotation.x = -Math.PI*0.5;
  water.position.y = MAIN.WATER_Y;
  scene.add(water);
  

  TREEMANAGER.init();

  // Terrain
  scene.add(WORLDMANAGER.superchunkObject);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

var helper = new THREE.DirectionalLightHelper(dirLight, 5);
MAIN.updateShadows = function() {
  const basePos = WORLDMANAGER.superchunkObject.position;
  dirLight.position.copy(basePos);
  dirLight.position.y = 100;
  dirLight.target.position.copy(basePos);
  dirLight.target.position.y = 0;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
}

MAIN.updateWater = function() {
  water.position.copy(WORLDMANAGER.superchunkObject.position);
  water.position.y = MAIN.WATER_Y;
}

function animate() {
  requestAnimationFrame(animate);

  WORLDMANAGER.update();
  TREEMANAGER.update();

  const time = performance.now();

  // Prevent falling through world when delta is large, which could be
  // triggered by tabbing out or otherwise pausing the animation.
  const delta = Math.min((time - prevTime) / 1000, 0.1);
  prevTime = time;

  PLAYER.update(delta);

  const offset = (time / 30000) % 1;
  water.material.normalMap.offset.set(offset, offset);

  renderer.render(scene, camera);
}



init();
animate();


})();
