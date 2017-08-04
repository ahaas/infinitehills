/* WORLDMANAGER manages the THREEJS geometry that constitutes the world.
 */

WORLDMANAGER = {};

(function() {

// Magic fencepost offset: fix fencepost issues caused by reasoning by
// vertices vs length.
// TODO: Clean this up more systematically.
const MAGIC_FPO = HEIGHTMAP.SUPERCHUNK_RES
                  / (HEIGHTMAP.SUPERCHUNK_RES - 1);

let superchunkMaterial;
(function () {
  const texture = new THREE.TextureLoader().load('textures/grass.jpg');
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  const textureRepeat = HEIGHTMAP.CHUNK_SIZE*MAGIC_FPO;
  texture.repeat.set(textureRepeat,  textureRepeat);
  superchunkMaterial = new THREE.MeshPhongMaterial({
    color: 0x33ff33,
    map: texture,
    shininess: 5,
  });
})();

// Only a single geometry is used and modified as needed. This
// significantly improves performance compared to creating new
// geometries, probably because of memory allocation.
const superchunkGeometry = new THREE.PlaneGeometry(
    HEIGHTMAP.CHUNK_SIZE*3/MAGIC_FPO,
    HEIGHTMAP.CHUNK_SIZE*3/MAGIC_FPO,
    HEIGHTMAP.CHUNK_RES*3-1,
    HEIGHTMAP.CHUNK_RES*3-1);
superchunkGeometry.rotateX(-Math.PI/2);

const superchunkObject = new THREE.Mesh(superchunkGeometry, superchunkMaterial);
WORLDMANAGER.superchunkObject = superchunkObject;


// The chunk the player is currently located in.
let curChunk = [NaN, NaN];


WORLDMANAGER.update = function() {
  const newChunk = WORLDMANAGER.getCurrentChunk();
  if (curChunk[0] != newChunk[0] || curChunk[1] != newChunk[1]) {
    curChunk = newChunk;
    WORLDMANAGER.updateSuperchunkObject();
  }
}


// Update the superchunkObject and its geometry based on the player's
// position.
WORLDMANAGER.updateSuperchunkObject = function () {
  // Update vertices.
  const SUPERCHUNK_RES = HEIGHTMAP.SUPERCHUNK_RES;
  const nVertices = superchunkGeometry.vertices.length;
  const expectedVertices = SUPERCHUNK_RES * SUPERCHUNK_RES;
  if (nVertices !== expectedVertices) {
    throw 'Plane only has ' + nVertices + ' vertices, needs ' + expectedVertices;
  }
  const heightmap = HEIGHTMAP.generateSuperchunk(curChunk[0], curChunk[1]);
  for (var y=0; y < SUPERCHUNK_RES; y++) {
    for (var x=0; x < SUPERCHUNK_RES; x++) {
      superchunkGeometry.vertices[y*SUPERCHUNK_RES + x].y = heightmap[x][y];
    }
  }
  superchunkGeometry.verticesNeedUpdate = true;
  superchunkGeometry.computeVertexNormals();

  // Update mesh position.
  superchunkObject.position.setX(curChunk[0] * HEIGHTMAP.CHUNK_SIZE)
                           .setZ(curChunk[1] * HEIGHTMAP.CHUNK_SIZE);
};


// Returns [x,y] index of the chunk that the player is in.
WORLDMANAGER.getCurrentChunk = function () {
  const pos = MAIN.controls.getObject().position;
  const px = pos.x, py = pos.z;

  const cs = HEIGHTMAP.CHUNK_SIZE
  const cx = Math.floor((px + cs/2) / cs);
  const cy = Math.floor((py + cs/2) / cs);
  return [cx, cy];
}


})();
