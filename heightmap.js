HEIGHTMAP = {};

(function() {

const CHUNK_SIZE = 100; // physical size of chunk, in meters
const CHUNK_RES = 50;  // length along one edge of the square chunk
                        // 250^2 * 8bytes/number = 0.5MiB / chunk heightmap
const HILL_MIN_RADIUS = 5 * CHUNK_RES / CHUNK_SIZE;
const HILL_MAX_RADIUS = 10 * CHUNK_RES / CHUNK_SIZE;
const HILLS_PER_CHUNK = 300;

const HEIGHTMAP_OFFSET = -35;
const HEIGHTMAP_FACTOR = 0.04 * CHUNK_SIZE / CHUNK_RES;

HEIGHTMAP.CHUNK_RES = CHUNK_RES;
HEIGHTMAP.CHUNK_SIZE = CHUNK_SIZE;
/**
 * Return a list of (x, y, r) hill locations within a chunk.
 * If supplied, offset parameters will be used to move the outputted (x,y)
 */
// TODO: Memoize.
function generateHills (chunkX, chunkY, offsetX, offsetY) {
  const out = [];
  const random = new Random(chunkX + chunkY * 16807);
  for (var i=0; i < HILLS_PER_CHUNK; i++) {
    const r = random.nextFloat() * (HILL_MAX_RADIUS - HILL_MIN_RADIUS) + HILL_MIN_RADIUS;
    let x = random.nextFloat() * CHUNK_RES;
    let y = random.nextFloat() * CHUNK_RES;
    if (offsetX) {
      x += offsetX * CHUNK_RES;
      offsetX > 0 ? x-- : x++;
    }
    if (offsetY) {
      y += offsetY * CHUNK_RES;
      offsetY > 0 ? y-- : y++;
    }
    out.push([x, y, r]);
  }
  return out;
}
HEIGHTMAP.generateHills_ = generateHills;

/* Generate the chunk located at (x, y). */
// TODO: Memoize.
HEIGHTMAP.generateChunk = function (chunkX, chunkY) {
  // Create zero-filled heightmap for chunk.
  heightmap = [];
  for (var x=0; x < CHUNK_RES; x++) {
    heightmap[x] = [];
    for (var y=0; y < CHUNK_RES; y++) {
      heightmap[x][y] = 0;
    }
  }

  // Generate hills, including ones from neighboring chunks.
  // http://www.stuffwithstuff.com/robot-frog/3d/hills/hill.html
  const cx = chunkX, cy = chunkY;
  let hills = [];  // (x, y, r) tuples
  for (const cc of [[-1, -1], [0, -1], [1, -1],
                    [-1, 0], [0, 0], [1, 0],
                    [-1, 1], [0, 1], [1, 1]]) {
    hills = hills.concat(generateHills(cx + cc[0], cy + cc[1], cc[0], cc[1]));
  }

  // Push up the terrain for each hill.
  for (const hill of hills) {
    const hx = hill[0], hy = hill[1], hr = hill[2];
    for (var x=Math.floor(Math.max(hx-hr,0)); x < hx+hr && x < CHUNK_RES; x++) {
      for (var y=Math.floor(Math.max(hy-hr,0)); y < hy+hr && y < CHUNK_RES; y++) {
        const dx = x-hx;
        const dy = y-hy;
        heightmap[x][y] += Math.max(hr*hr - (dx*dx + dy*dy), 0);
      }
    }
  }

  return heightmap;
};

HEIGHTMAP.applyPlaneGeometry = function (geometry, chunkX, chunkY) {
  const heightmap = HEIGHTMAP.generateChunk(chunkX, chunkY);
  const nVertices = geometry.vertices.length;
  if (nVertices !== CHUNK_RES * CHUNK_RES) {
    throw 'Plane only has ' + nVertices + ' vertices, needs ' + CHUNK_SIZE * CHUNK_SIZE;
  }
  for (var y=0; y < CHUNK_RES; y++) {
    for (var x=0; x < CHUNK_RES; x++) {
      geometry.vertices[y*CHUNK_RES + x].y = heightmap[x][y]*HEIGHTMAP_FACTOR + HEIGHTMAP_OFFSET;
    }
  }
}


})();
