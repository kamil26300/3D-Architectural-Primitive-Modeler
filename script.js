// Set up scene, camera, and renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 5, 10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add camera controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Add grid floor
const gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

const objects = []; // Store added objects
let selectedObject = null; // Track selected object

// Function to check for overlapping objects
function getSafePosition() {
  let baseHeight = 0.5; // Start from ground level

  objects.forEach(obj => {
    if (Math.abs(obj.position.x) < 0.6 && Math.abs(obj.position.z) < 0.6) {
      baseHeight = Math.max(baseHeight, obj.position.y + obj.geometry.parameters.height || 1);
    }
  });

  return baseHeight;
}

// Function to add a shape at the center
function addShape() {
  const shapeType = document.getElementById("shape").value;
  let geometry, material, mesh;

  material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });

  if (shapeType === "cube") {
    geometry = new THREE.BoxGeometry(1, 1, 1);
  } else if (shapeType === "cylinder") {
    geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
  } else if (shapeType === "sphere") {
    geometry = new THREE.SphereGeometry(0.5, 32, 32);
  }

  const safeY = getSafePosition(); // Get height to prevent overlap
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, safeY, 0);
  scene.add(mesh);
  objects.push(mesh);

  setSelectedObject(mesh); // Select new object
}

// Function to remove last added shape
function removeLastShape() {
  if (objects.length > 0) {
    const lastObject = objects.pop();
    scene.remove(lastObject);
  }
}

// Function to set selected object
function setSelectedObject(obj) {
  selectedObject = obj;
  document.getElementById("selectedInfo").innerText = `Selected Object: ${obj.geometry.type}`;
}

// Mouse click event to select an object
window.addEventListener('click', (event) => {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(objects);

  if (intersects.length > 0) {
    setSelectedObject(intersects[0].object);
  }
});

// Function to move selected object
function moveSelectedObject(direction) {
  if (!selectedObject) return;

  const step = 0.5; // Movement step size
  const newPosition = selectedObject.position.clone(); // Clone current position

  // Determine new position based on direction
  if (direction === "left") newPosition.x -= step;
  if (direction === "right") newPosition.x += step;
  if (direction === "forward") newPosition.z -= step;
  if (direction === "backward") newPosition.z += step;
  if (direction === "up") newPosition.y += step;
  if (direction === "down") newPosition.y -= step;

  // Check for collision before moving
  if (!isColliding(selectedObject, newPosition)) {
    selectedObject.position.copy(newPosition);
  }
}

function isColliding(object, newPosition) {
  const objectBox = new THREE.Box3().setFromObject(object);
  const offset = newPosition.clone().sub(object.position);
  objectBox.translate(offset); // Move bounding box to new position

  for (const otherObject of objects) {
    if (otherObject !== object) {
      const otherBox = new THREE.Box3().setFromObject(otherObject);

      // Calculate the minimum allowed distance (step size)
      const minDistance = 0.5; // Same as movement step

      // Check actual distance between objects
      const distance = objectBox.distanceToPoint(otherObject.position);

      // If the objects are closer than the step but not colliding, allow movement
      if (objectBox.intersectsBox(otherBox) && distance < minDistance) {
        return true; // Collision detected
      }
    }
  }
  return false; // No collision, movement allowed
}



// Handle keyboard input for movement
window.addEventListener("keydown", (event) => {
  if (!event.shiftKey && (event.key === "a" || event.key === "A")) moveSelectedObject("left");
  if (!event.shiftKey && (event.key === "d" || event.key === "D")) moveSelectedObject("right");
  if (!event.shiftKey && (event.key === "w" || event.key === "W")) moveSelectedObject("forward");
  if (!event.shiftKey && (event.key === "s" || event.key === "S")) moveSelectedObject("backward");
  if (event.shiftKey && (event.key === "w" || event.key === "W")) moveSelectedObject("up");
  if (event.shiftKey && (event.key === "s" || event.key === "S")) moveSelectedObject("down");
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
