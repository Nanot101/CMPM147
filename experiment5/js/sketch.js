let bestDesign;
let currentDesign;
let currentScore;
let currentInspiration;
let currentCanvas;
let currentInspirationPixels;
let mutationCount = 0;
let mutationTimer = 0;

function preload() {
  let allInspirations = getInspirations();
  for (let i = 0; i < allInspirations.length; i++) {
    let insp = allInspirations[i];
    insp.image = loadImage(insp.assetUrl);
    let option = document.createElement("option");
    option.value = i;
    option.innerHTML = insp.name;
    dropper.appendChild(option);
  }
  dropper.onchange = e => inspirationChanged(allInspirations[e.target.value]);
  currentInspiration = allInspirations[0];
  restart.onclick = () =>
    inspirationChanged(allInspirations[dropper.value]);
}

function inspirationChanged(nextInspiration) {
  currentInspiration = nextInspiration;
  currentDesign = undefined;
  memory.innerHTML = "";
  setup();
}

function setup() {
  if (!currentInspiration || !currentInspiration.image) {
    console.error("No inspiration image ready yet!");
    return;
  }

  let w = currentInspiration.image.width;
  let h = currentInspiration.image.height;
  currentCanvas = createCanvas(w, h);
  currentCanvas.parent(document.getElementById("active"));

  // Update the visible inspiration image (optional enhancement)
  if (document.getElementById("original")) {
    document.getElementById("original").src = currentInspiration.image.canvas.toDataURL();
  }

  currentScore = Number.NEGATIVE_INFINITY;
  currentDesign = initDesign(currentInspiration);
  bestDesign = currentDesign;

  image(currentInspiration.image, 0, 0, w, h);
  loadPixels();
  currentInspirationPixels = pixels;

  mutationTimer = 0;
}

function evaluate() {
  loadPixels();
  let error = 0;
  let n = pixels.length;

  for (let i = 0; i < n; i++) {
    error += sq(pixels[i] - currentInspirationPixels[i]);
  }
  return 1 / (1 + error / n);
}

function memorialize() {
  let url = currentCanvas.canvas.toDataURL();

  let img = document.createElement("img");
  img.classList.add("memory");
  img.src = url;
  img.width = width;
  img.height = height;

  img.title = currentScore;
  document.getElementById("best").innerHTML = "";
  document.getElementById("best").appendChild(img.cloneNode());

  img.width = width / 2;
  img.height = height / 2;

  memory.insertBefore(img, memory.firstChild);

  if (memory.childNodes.length > memory.dataset.maxItems) {
    memory.removeChild(memory.lastChild);
  }
}

function draw() {
  if (!currentDesign) {
    return;
  }

  // Decrease mutation rate over time
  mutationTimer += 1;
  if (mutationTimer >= 600) {
    slider.value = Math.max(1, slider.value - 1); // avoid negative values
    mutationTimer = 0;
  }

  randomSeed(mutationCount++);
  currentDesign = JSON.parse(JSON.stringify(bestDesign));
  rate.innerHTML = slider.value;
  mutateDesign(currentDesign, currentInspiration, slider.value / 100.0);

  randomSeed(0);
  renderDesign(currentDesign, currentInspiration);
  let nextScore = evaluate();
  activeScore.innerHTML = nextScore;

  if (nextScore > currentScore) {
    currentScore = nextScore;
    bestDesign = currentDesign;
    memorialize();
    bestScore.innerHTML = currentScore;
    mutationTimer = 0; // reset timer on improvement
  }

  fpsCounter.innerHTML = Math.round(frameRate());
}
