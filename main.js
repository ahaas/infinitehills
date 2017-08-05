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
const hemiLight = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.3);
const controls = new THREE.PointerLockControls(camera);
const renderer = new THREE.WebGLRenderer();
MAIN.scene = scene;
MAIN.controls = controls;


let prevTime = performance.now();

init();
animate();

function init () {
  const SKY_COLOR = 0x7EC0EE
  hemiLight.position.set(0.095, 1, 0.75);
  scene.add(hemiLight);
  scene.fog = new THREE.Fog(SKY_COLOR, HEIGHTMAP.CHUNK_SIZE*0.6, HEIGHTMAP.CHUNK_SIZE);
  scene.add(controls.getObject());
  renderer.setClearColor(SKY_COLOR);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  PLAYER.setUpControls();
  window.addEventListener('resize', onWindowResize, false);

  // Directional light.
  dirLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
  dirLight.color.setHSL( 0.1, 1, 0.5 );
  dirLight.position.set( -1, 1.75, 1 );
  dirLight.position.multiplyScalar( 50 );
  scene.add( dirLight );
  /*dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;*/
  var d = 50;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.far = 3500;
  dirLight.shadow.bias = -0.0001;

  // Box.
  const boxMaterial = new THREE.MeshPhongMaterial({
    color: 0xffffff,
  });
  const boxGeometry = new THREE.BoxGeometry(1, 2, 1);
  //const boxMaterial = new THREE.MeshBasicMaterial({color: 0xff2222, side: THREE.DoubleSide});
  const box = new THREE.Mesh(boxGeometry, boxMaterial);
  scene.add(box);

  // Terrain
  scene.add(WORLDMANAGER.superchunkObject);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  WORLDMANAGER.update();

  const time = performance.now();
  const delta = Math.min((time - prevTime) / 1000, 0.1);
  prevTime = time;
  // Prevent falling through world when delta is large, which could be
  // triggered by tabbing out or otherwise pausing the animation.
  PLAYER.update(delta);

  renderer.render(scene, camera);
}




})();
