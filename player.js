/* Some helper functions to help with first-person player controls. */

PLAYER = {};


(function() {

let ply;
const velocity = new THREE.Vector3(0,0,0);

PLAYER.HEIGHT = 2;  // Height, in meters.

const MOVESPEED = 4;
const FLYSPEED = 200;
const DECEL = 10;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveFast = false;
let isOnGround = false;
let flying = false;
const tmp = new THREE.Vector3();
PLAYER.update = function (delta) {
  if (!ply) {
    ply = MAIN.controls.getObject();
  }

  if (flying) {
    velocity.set(0,0,0);
    MAIN.controls.getDirection(tmp)
    let pitch = Math.asin(tmp.y);
    if (pitch !== pitch) {
      pitch = tmp.y === 1 ? Math.PI/2 : -Math.PI/2;
    }
    if (moveForward) velocity.z = -FLYSPEED;
    if (moveBackward) velocity.z = FLYSPEED;
    if (moveLeft) velocity.x = -FLYSPEED;
    if (moveRight) velocity.x = FLYSPEED;
    velocity.applyEuler(new THREE.Euler(pitch, 0, 0));
    if (moveFast) velocity.multiplyScalar(3);
  } else {
    velocity.x -= velocity.x * DECEL * delta;
    velocity.z -= velocity.z * DECEL * delta;
    velocity.y -= 9.8 * delta;
    let ms = moveFast ? MOVESPEED * 2.2 : MOVESPEED;

    // Prevent the player from moving too fast diagonally.
    if ((moveForward || moveBackward) && (moveLeft || moveRight)) {
      ms /= 1.4;
    }

    if (moveForward) velocity.z = -ms;
    if (moveBackward) velocity.z = ms;
    if (moveLeft) velocity.x = -ms;
    if (moveRight) velocity.x = ms;
  }
  if (velocity.lengthManhattan() < 0.001) {
    velocity.set(0,0,0);
  }
  ply.translateX(velocity.x * delta)
     .translateY(velocity.y * delta)
     .translateZ(velocity.z * delta);

  if (!flying) {
    updateGround();
  }
};

const raycaster = new THREE.Raycaster();
const dirDown = new THREE.Vector3(0,-1,0);
function updateGround () {
  raycaster.set(ply.position, dirDown);
  //console.log(raycaster.intersectObjects(MAIN.scene.children));

  // We only care about the closest hit.
  const hit = raycaster.intersectObjects(MAIN.scene.children)[0];
  if (!hit) {
    return;
  }

  if (isOnGround) {
    // Player was on the ground in the last frame.
    if (hit.distance < PLAYER.HEIGHT * 1.2) {
      // Player is still on ground, so keep them on the ground.
      // (Tolerance accounts for walking downhill.)
      velocity.y = 0;
      ply.position.y += PLAYER.HEIGHT - hit.distance;
    } else {
      // Player fell off an object or a steep cliff.
      isOnGround = false;
    }
  }

  if (hit.distance < PLAYER.HEIGHT) {
    // Player is about to sink into the ground. Could result from either
    // falling, landing a jump, or walking uphill.
    velocity.y = 0;
    ply.position.y += PLAYER.HEIGHT - hit.distance;
    isOnGround = true;
  }
};


function jump () {
  if (isOnGround) velocity.y += 4;
  isOnGround = false;
};


PLAYER.setUpControls = function () {
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
        jump();
        break;
      case 86: // v
        flying = !flying;
        console.log("flying = " + flying);
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

})();
