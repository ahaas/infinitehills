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

const camera = new THREE.PerspectiveCamera(80, window.innerWidth/window.innerHeight, 1, 2000);
const scene = new THREE.Scene();
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.3);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
const controls = new THREE.PointerLockControls(camera);
const renderer = new THREE.WebGLRenderer();
MAIN.camera = camera;
MAIN.scene = scene;
MAIN.controls = controls;


let prevTime = performance.now();

function init () {
  const SKY_COLOR = 0x7EC0EE
  hemiLight.position.set(0.095, 1, 0.75);
  scene.add(hemiLight);
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
  dirLight.position.set( -1, 1.75, 1 );
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

  const ambientLight = new THREE.AmbientLight(0x404040);
  MAIN.scene.add(ambientLight);

  // Box.
  const boxMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
  });
  const boxGeometry = new THREE.BoxGeometry(1, 2, 1);
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.castShadow = true;
  scene.add(box);

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
  //dirLight.position.x -= 60;
  //dirLight.position.z += 60;
  dirLight.target.position.copy(basePos);
  dirLight.target.position.y = 0;
  //dirLight.target.position.x += 60;
  //dirLight.target.position.z -= 60;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
}

function animate() {
  requestAnimationFrame(animate);

  WORLDMANAGER.update();
  TREEMANAGER.update();

  const time = performance.now();
  const delta = Math.min((time - prevTime) / 1000, 0.1);
  prevTime = time;
  // Prevent falling through world when delta is large, which could be
  // triggered by tabbing out or otherwise pausing the animation.
  PLAYER.update(delta);

  renderer.render(scene, camera);
}



init();
animate();


})();
