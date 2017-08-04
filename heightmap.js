/* HEIGHTMAP provides an API to generate heightmaps of rolling hills.
 * This real-time algorithm is based on the article here:
 * http://www.stuffwithstuff.com/robot-frog/3d/hills/hill.html
 *
 * This implementation utilizes a PRNG so that the hills in each chunk
 * are deterministic.
 */

HEIGHTMAP = {};


(function() {


// Physical size of chunk, in meters.
const CHUNK_SIZE = 500;

// Vertices along one edge of the chunk. This is the primary determinant
// of performance of generateHills() and THREEJS geometry updates.
const CHUNK_RES = 50;

// A superchunk is a 3x3 group of chunks.
const SUPERCHUNK_RES = CHUNK_RES*3;

const HILL_MIN_RADIUS = 4;
const HILL_MAX_RADIUS = 11;
const HILLS_PER_CHUNK = 300;

const HEIGHTMAP_OFFSET = -200;
const HEIGHTMAP_FACTOR = 0.06;

// These parameters are also needed to create the THREEJS geometries.
HEIGHTMAP.CHUNK_RES = CHUNK_RES;
HEIGHTMAP.CHUNK_SIZE = CHUNK_SIZE;
HEIGHTMAP.SUPERCHUNK_RES = SUPERCHUNK_RES;


/**
 * Return a list of (x, y, r) hill locations within a chunk.
 * If supplied, offset parameters will be used to move the outputted
 * coordinates.
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
      //offsetX > 0 ? x-- : x++;
    }
    if (offsetY) {
      y += offsetY * CHUNK_RES;
      //offsetY > 0 ? y-- : y++;
    }
    out.push([x, y, r]);
  }
  return out;
};


/* Generate the heightmap that includes the chunk located at the
 * supplied coordinates, as well as the 8 surrounding chunks. */
HEIGHTMAP.generateSuperchunk = function (chunkX, chunkY) {
  // Initialize heightmap array.
  heightmap = [];
  for (var x=0; x < CHUNK_RES * 3; x++) {
    heightmap[x] = [];
    for (var y=0; y < CHUNK_RES * 3; y++) {
      heightmap[x][y] = 0;
    }
  }

  // Generate hills, including ones from neighboring chunks, since the
  // 9 chunks in the super chunk may also include parts of hills located
  // outside the 9 chunks. Thus, in total, 25 chunks worth of hills are
  // required.
  const cx = chunkX, cy = chunkY;
  let hills = [];  // (x, y, r) tuples
  for (var ix=-2; ix<=2; ix++) {
    for (var iy=-2; iy<=2; iy++) {
      hills = hills.concat(generateHills(cx+ix, cy+iy, ix+1, iy+1));
    }
  }

  // Push up the terrain for each hill. Ignore coordinates outside the
  // superchunk.
  for (const hill of hills) {
    const hx = hill[0], hy = hill[1], hr = hill[2];
    for (var x=Math.floor(Math.max(hx-hr,0)); x < hx+hr && x < CHUNK_RES*3; x++) {
      for (var y=Math.floor(Math.max(hy-hr,0)); y < hy+hr && y < CHUNK_RES*3; y++) {
        const dx = x-hx;
        const dy = y-hy;
        heightmap[x][y] += Math.max(hr*hr - (dx*dx + dy*dy), 0);
      }
    }
  }

  // Multiply and offset by constant factors.
  for (var x=0; x < CHUNK_RES * 3; x++) {
    for (var y=0; y < CHUNK_RES * 3; y++) {
      heightmap[x][y] = heightmap[x][y] * HEIGHTMAP_FACTOR + HEIGHTMAP_OFFSET;
    }
  }

  return heightmap;
};


})();
