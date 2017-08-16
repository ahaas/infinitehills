/**
 * Manages the creation of trees.
 */

TREEMANAGER = {};

(function() {

const HEIGHT = 30;
const Y_OFFSET = 9.5;

const treePool = [];
const trees = [];
TREEMANAGER.trees_ = trees;

const cyPool = [];
const cys = [];

const treeMats = [];

TREEMANAGER.init = function () {
  const textureLoader = new THREE.TextureLoader();
  for (var i=1; i <= 8; i++) {
    const texture = textureLoader.load('assets/sprites/tree' + i + '.png');
    const material = new THREE.MeshBasicMaterial({
      color: 0xaacc88,
      map: texture,
      transparent: true,
      depthWrite: false
    });
    treeMats.push(material);
  }
};

const geometry = new THREE.PlaneGeometry(HEIGHT, HEIGHT);
TREEMANAGER.makeTree = function(pos, matNo) {
  let plane;
  if (treePool.length > 0) {
    plane = treePool.pop();
    plane.material = treeMats[matNo];
  } else {
    plane = new THREE.Mesh(geometry, treeMats[matNo]);
  }
  plane.position.copy(pos);
  plane.position.y += Y_OFFSET;
  MAIN.scene.add(plane);
  trees.push(plane);

  // Add cylinder to cast shadow.
  let cy;
  if (cyPool.length > 0) {
    cy = cyPool.pop();
  } else {
    cy = new THREE.Mesh(new THREE.CylinderGeometry(4, 7, 6), new THREE.MeshBasicMaterial());
    cy.material.opacity = 0.0001;
    cy.material.transparent = true;
    cy.material.depthWrite = false;
    cy.castShadow = true;
  }
  cy.position.copy(plane.getWorldPosition());
  cys.push(cy);
  MAIN.scene.add(cy);
};

TREEMANAGER.update = function() {
  trees.forEach(function(treeObj) {
    const pos = MAIN.camera.getWorldPosition();
    pos.y = treeObj.position.y;
    treeObj.lookAt(pos);
  });
}

TREEMANAGER.clear = function () {
  trees.forEach(function(treeObj) {
    MAIN.scene.remove(treeObj);
    treePool.push(treeObj);
  });
  trees.length = 0;

  cys.forEach(function(cy) {
    MAIN.scene.remove(cy);
    cyPool.push(cy);
  });
  cys.length = 0;
};


})();

