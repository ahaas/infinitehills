// Based on
// https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html

MAIN = {};


(function() {
const blocker = document.getElementById( 'blocker' );
const instructions = document.getElementById( 'instructions' );

const havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

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

let controlsEnabled = false;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveFast = false;
let canJump = false;
let flying = true;  // TODO: Change default to not flying.

let prevTime = performance.now();
let velocity = new THREE.Vector3(0,0,0);

init();
animate();

function init () {
  const SKY_COLOR = 0x7EC0EE
  hemiLight.position.set(0.095, 1, 0.75);
  scene.add(hemiLight);
  scene.fog = new THREE.Fog(SKY_COLOR, 0, 1000);
  scene.add(controls.getObject());
  renderer.setClearColor(SKY_COLOR);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  setUpControls();
  window.addEventListener('resize', onWindowResize, false);

  // Directional light.
  dirLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
  dirLight.color.setHSL( 0.1, 1, 0.5 );
  dirLight.position.set( -1, 1.75, 1 );
  dirLight.position.multiplyScalar( 50 );
  scene.add( dirLight );
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
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
}

function setUpControls() {
  var onKeyDown = function ( event ) {
    switch ( event.keyCode ) {
      case 16: // shift
        moveFast = true;
        break;
      case 38: // up
      case 87: // w
        moveForward = true;
        break;
      case 37: // left
      case 65: // a
        moveLeft = true; break;
      case 40: // down
      case 83: // s
        moveBackward = true;
        break;
      case 39: // right
      case 68: // d
        moveRight = true;
        break;
      case 32: //space
        if (canJump) velocity.y += 4;
        canJump = false;
        break;
      case 86: // v
        velocity.set(0,0,0);
        flying = !flying;
        console.log("Flying = " + flying);
        break;
    }
  };
  var onKeyUp = function ( event ) {
    switch( event.keyCode ) {
      case 16: // shift
        moveFast = false;
        break;
      case 38: // up
      case 87: // w
        moveForward = false;
        break;
      case 37: // left
      case 65: // a
        moveLeft = false;
        break;
      case 40: // down
      case 83: // s
        moveBackward = false;
        break;
      case 39: // right
      case 68: // d
        moveRight = false;
        break;
    }
  };
  document.addEventListener( 'keydown', onKeyDown, false );
  document.addEventListener( 'keyup', onKeyUp, false );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

const MOVESPEED = 1.4;
const FLYSPEED = 10;
const DECEL = 10;
const tmp = new THREE.Vector3();
function animate() {
  requestAnimationFrame(animate);
  if (controlsEnabled) {
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (flying) {
      velocity.set(0,0,0);
      controls.getDirection(tmp)
      let pitch = Math.asin(tmp.y);
      if (pitch !== pitch) {
        pitch = tmp.y === 1 ? Math.PI/2 : -Math.PI/2;
      }
      if (moveForward) velocity.z = -FLYSPEED;
      if (moveBackward) velocity.z = FLYSPEED;
      if (moveLeft) velocity.x = -FLYSPEED;
      if (moveRight) velocity.x = FLYSPEED;
      velocity.applyEuler(new THREE.Euler(pitch, 0, 0));
      if (moveFast) velocity.multiplyScalar(10);
    } else {
      velocity.x -= velocity.x * DECEL * delta;
      velocity.z -= velocity.z * DECEL * delta;
      velocity.y -= 9.8 * delta;
      const ms = moveFast ? MOVESPEED * 2 : MOVESPEED;
      if (moveForward) velocity.z = -ms;
      if (moveBackward) velocity.z = ms;
      if (moveLeft) velocity.x = -ms;
      if (moveRight) velocity.x = ms;
    }
    controls.getObject().translateX(velocity.x * delta)
                        .translateY(velocity.y * delta)
                        .translateZ(velocity.z * delta);
    WORLDMANAGER.update();

    // Floor.
    if (controls.getObject().position.y < 2 && !flying) {
      velocity.y = 0;
      controls.getObject().position.y = 2;
      canJump = true;
    }


    prevTime = time;
  }
  renderer.render(scene, camera);
}




})();
