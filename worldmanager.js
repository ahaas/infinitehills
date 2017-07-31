WORLDMANAGER = {};

(function() {
const planeGeometries = [];
for (var i=0; i<30; i++) {
  const geo = new THREE.PlaneGeometry(HEIGHTMAP.CHUNK_SIZE, HEIGHTMAP.CHUNK_SIZE, HEIGHTMAP.CHUNK_RES-1, HEIGHTMAP.CHUNK_RES-1);
  geo.rotateX(-Math.PI/2);
  planeGeometries.push(geo);
}

let curChunk = [-100, -100];
WORLDMANAGER.update = function() {
  const newChunk = WORLDMANAGER.getCurrentChunk();
  if (curChunk[0] != newChunk[0] || curChunk[1] != newChunk[1]) {
    curChunk = newChunk;
    WORLDMANAGER.updateLoadedChunks();
  }
}

// Returns [x,y] index of current chunk.
WORLDMANAGER.getCurrentChunk = function () {
  const pos = MAIN.controls.getObject().position;
  const px = pos.x, py = pos.z;

  const cs = HEIGHTMAP.CHUNK_SIZE
  const cx = Math.floor((px + cs/2) / cs);
  const cy = Math.floor((py + cs/2) / cs);
  return [cx, cy];
}

const loadedChunks = [];  // [[cx, cy], Plane]
WORLDMANAGER.loadedChunks_ = loadedChunks;

const MAX_CHUNK_DIST = 1;
WORLDMANAGER.updateLoadedChunks = function () {
  // Prune chunks that are too far.
  const chunksToDelete = [];
  for (chunk of loadedChunks) {
    const cc = chunk[0];
    if (Math.max(Math.abs(cc[0]-curChunk[0]), Math.abs(cc[1]-curChunk[1])) > MAX_CHUNK_DIST) {
      chunksToDelete.push(chunk);
      planeGeometries.push(chunk[1].geometry);
      MAIN.scene.remove(chunk[1]);
    }
  }
  for (chunk of chunksToDelete) {
    const index = loadedChunks.indexOf(chunk);
    loadedChunks.splice(index, 1);
  }

  // Create chunks.
  for (var cx=curChunk[0]-MAX_CHUNK_DIST; cx <= curChunk[0]+MAX_CHUNK_DIST; cx++) {
    for (var cy=curChunk[1]-MAX_CHUNK_DIST; cy <= curChunk[1]+MAX_CHUNK_DIST; cy++) {
      WORLDMANAGER.createChunkAt(cx, cy);
    }
  }
}

WORLDMANAGER.isChunkLoaded = function(cx, cy) {
  for (chunk of loadedChunks) {
    if (chunk[0][0] == cx && chunk[0][1] == cy) {
      return true;
    }
  }
  return false;
}

const texture = new THREE.TextureLoader().load('textures/grass.jpg');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(HEIGHTMAP.CHUNK_SIZE,HEIGHTMAP.CHUNK_SIZE);
const material = new THREE.MeshPhongMaterial({
  color: 0x44ff44,
  map: texture,
});

WORLDMANAGER.createChunkAt = function(cx, cy) {
  if (WORLDMANAGER.isChunkLoaded(cx, cy)) return;
  // Floor mesh.
  //const geometry = new THREE.PlaneGeometry(HEIGHTMAP.CHUNK_SIZE, HEIGHTMAP.CHUNK_SIZE, HEIGHTMAP.CHUNK_RES-1, HEIGHTMAP.CHUNK_RES-1);
  //geometry.rotateX(-Math.PI/2);
  const geometry = planeGeometries.shift();
  HEIGHTMAP.applyPlaneGeometry(geometry, cx, cy);
  geometry.verticesNeedUpdate = true;
  geometry.computeVertexNormals();
  const plane = new THREE.Mesh(geometry, material);
  plane.translateX(cx * HEIGHTMAP.CHUNK_SIZE);
  plane.translateZ(cy * HEIGHTMAP.CHUNK_SIZE);
  loadedChunks.push([[cx, cy], plane]);
  MAIN.scene.add(plane);
}



})();
