"use strict";

/* global XXH */
/* exported
    p3_preload
    p3_setup
    p3_worldKeyChanged
    p3_tileWidth
    p3_tileHeight
    p3_tileClicked
    p3_drawBefore
    p3_drawTile
    p3_drawSelectedTile
    p3_drawAfter
*/

// Initialize
let currentProject = "rollingHills";
let worldSeed;
let snowmen = {};
let seeds = {};
let snowballAnimations = {};
let clicks = {};



function p3_preload() {}

function p3_setup() {
  // Hooking up the switch button
  document.getElementById("switch-project").addEventListener("click", () => {
    currentProject = document.getElementById("project-select").value;
    clicks = {}; 
  });
}

function p3_worldKeyChanged(key) {
    worldSeed = XXH.h32(key, 0);
    noiseSeed(worldSeed);
    randomSeed(worldSeed);
  
    // Reset objects
    snowmen = {};
    snowballAnimations = {};
    seeds = {};
  }
  

// Tile size
function p3_tileWidth() { return 32; }
function p3_tileHeight() { return 16; }
let [tw, th] = [p3_tileWidth(), p3_tileHeight()];



function p3_tileClicked(i, j) {
  if (currentProject === "rollingHills") {
    let key = [i, j];
    clicks[key] = 1 + (clicks[key] | 0);
  }
  // Snowball animation
  else if (currentProject === "findSnowmen") {
    let key = [i, j];
    if (snowmen[key]) {
      snowballAnimations[key] = { size: 30 };
    }
  }
  // Grow plant
  else if (currentProject === "plantSeeds") {
      plantSeedOnTile(i, j);
  }
}

function p3_drawBefore() {}

// Main functionality
function p3_drawTile(i, j) {
  if (currentProject === "rollingHills") {
    drawRollingHillsTile(i, j);
  } 
  else if (currentProject === "findSnowmen") {
    drawFindSnowmenTile(i, j);
  }
  else if (currentProject === "plantSeeds") {
    drawPlantSeedsTile(i, j);
  }
}
  

function p3_drawSelectedTile(i, j) {
  if (currentProject === "rollingHills") {
    noFill();
    stroke(0, 255, 0, 128);
    beginShape();
    vertex(-tw, 0);
    vertex(0, th);
    vertex(tw, 0);
    vertex(0, -th);
    endShape(CLOSE);

    noStroke();
    fill(0);
    textAlign(CENTER, CENTER);
    text("tile " + [i, j], 0, 0);
  } 

  if (currentProject === "plantSeeds") {
    noFill();
    stroke(0, 255, 0, 128);
    beginShape();
    vertex(-tw, 0);
    vertex(0, th);
    vertex(tw, 0);
    vertex(0, -th);
    endShape(CLOSE);

    noStroke();
    fill(0);
    textAlign(CENTER, CENTER);
    text("tile " + [i, j], 0, 0);
  }

  

}

function p3_drawAfter() {}


// === Function implementation of my ideas ===
function drawRollingHillsTile(i, j) {
  noStroke();

  let scale = 0.05;
  let heightNoise = noise(i * scale, j * scale);

  // Biome noise
  let biomeNoise = noise(i * 0.01 + 1000, j * 0.01 + 1000);
  let biome = getBiome(biomeNoise);

  // Pick color
  let groundColor = getGroundColor(biome, heightNoise);
  fill(groundColor);

  push();
  beginShape();
  vertex(-tw, 0);
  vertex(0, th);
  vertex(tw, 0);
  vertex(0, -th);
  endShape(CLOSE);

  maybePlaceObject(biome, i, j, heightNoise);
  pop();

  // Click effect
  let n = clicks[[i, j]] | 0;
  if (n % 2 === 1) {
    push();
    fill(0, 0, 0, 32);
    ellipse(0, 0, 10, 5);
    translate(0, -10);
    fill(255, 255, 100, 128);
    ellipse(0, 0, 10, 10);
    pop();
  }
}

function drawFindSnowmenTile(i, j) {
    noStroke();
  
    let scale = 0.05;
    let heightNoise = noise(i * scale, j * scale);
  
    // Snowy ground colors based on height
    if (heightNoise < 0.3) fill(230, 230, 255);  // light blue snow
    else if (heightNoise < 0.6) fill(245, 245, 255); // slightly brighter snow
    else fill(255, 255, 255); // plain white snow
  
    push();
    beginShape();
    vertex(-tw, 0);
    vertex(0, th);
    vertex(tw, 0);
    vertex(0, -th);
    endShape(CLOSE);

    // Draw snowman if there is one
    let key = [i, j];

    if (!(key in snowmen)) {
        let chance = XXH.h32("snowman:" + [i, j], worldSeed) % 100;
        // FINDME: ADJUST RATE OF SNOWMEN HERE
        snowmen[key] = (chance < 1);
    }
    if (snowmen[key]) {
        push();
        drawSnowman();
        pop();
    }
    pop();
  
    // Draw snowball animation
    if (snowballAnimations[key]) {
      let anim = snowballAnimations[key];
      fill(200, 230, 255, 180);
      ellipse(0, 0, anim.size, anim.size);
      
      anim.size -= 1.5;
      if (anim.size <= 0) {
        delete snowballAnimations[key];
      }
    }
    pop();
}


let hoveredTile = null;

function drawPlantSeedsTile(i, j) {
    // Draw grassland tiles
    let scaleFactor = 0.05;
    let heightNoise = noise(i * scaleFactor, j * scaleFactor);
    let greenShade = lerpColor(color(60, 140, 60), color(140, 220, 140), heightNoise);
    fill(greenShade);
    noStroke();
    beginShape();
    vertex(-tw, 0);
    vertex(0, th);
    vertex(tw, 0);
    vertex(0, -th);
    endShape(CLOSE);

  // Draw plants
  let key = [i, j];
  let seed = seeds[key];
  if (seed) {
    push();
    translate(0, -th / 4);

    let sproutPositionY = 0;

    if (!seed.grown) {
      // Still growing
      stroke(0, 100, 0);
      line(0, sproutPositionY, 0, sproutPositionY - seed.age / 5);
      sproutPositionY -= seed.age / 5;
      if (seed.age > 30) {
        fill(100, 200, 100);
        ellipse(0, sproutPositionY, 5, 5);
      }
      seed.age++;
      // Grown
      if (seed.age > 60) {
        seed.grown = true;
      }
    } else {
      // Flowering
      if (seed.flowerProgress < 1) {
        seed.flowerProgress += 0.05;
      }
      let size = easeOutBack(seed.flowerProgress);

      drawSunflower(seed.color, sproutPositionY, size);
    }

    pop();
  }
}



// === Helper functions ===
function getBiome(biomeNoise) {
  if (biomeNoise < 0.4) {
    return "forest";
  } else if (biomeNoise < 0.7) {
    return "desert";
  } else {
    return "stone";
  }
}

function getGroundColor(biome, heightNoise) {
  if (biome === "forest") {
    if (heightNoise < 0.4) return color(50, 120, 50);
    else if (heightNoise < 0.7) return color(80, 160, 80);
    else return color(120, 200, 120);
  } else if (biome === "desert") {
    if (heightNoise < 0.5) return color(220, 200, 120);
    else return color(240, 220, 150);
  } else if (biome === "stone") {
    if (heightNoise < 0.5) return color(100, 100, 100);
    else return color(160, 160, 160);
  }
}

function maybePlaceObject(biome, i, j, heightNoise) {
  let chance = XXH.h32("object:" + [i, j], worldSeed) % 100;

  if (biome === "forest" && heightNoise > 0.5 && chance < 20) {
    drawTree();
  }
  if (biome === "desert" && heightNoise > 0.3 && chance < 10) {
    drawCactus();
  }
  if (biome === "stone" && heightNoise > 0.4 && chance < 15) {
    drawRock();
  }
}

function drawTree() {
  push();
  fill(120, 72, 0);
  rect(-1, -8, 2, 8);
  fill(30, 100, 30);
  ellipse(0, -12, 10, 10);
  pop();
}

function drawCactus() {
  push();
  fill(0, 150, 0);
  rect(-1, -10, 2, 10);
  rect(-3, -7, 2, 5);
  rect(1, -5, 2, 5);
  pop();
}

function drawRock() {
  push();
  fill(90);
  ellipse(0, -4, 8, 6);
  ellipse(-2, -6, 5, 4);
  pop();
}

function drawSnowman() {
    push();
    stroke(0);
    strokeWeight(1);
    fill(255);
  
    // Bottom
    ellipse(0, 0, 16, 16);
    // Middle
    ellipse(0, -12, 12, 12);
    // Head
    ellipse(0, -22, 8, 8);
  
    // Eyes
    fill(0);
    noStroke();
    ellipse(-2, -23, 1.5, 1.5);
    ellipse(2, -23, 1.5, 1.5);
    pop();
  }

function plantSeedOnTile(i, j) {
  let key = [i, j];
  if (!seeds[key]) {
    seeds[key] = {
      age: 0,
      grown: false,
      flowerProgress: 0,
      color: randomSunflowerColor()
    };
  }
}
  
function drawSunflower(color, sproutPositionY, size) {
  push();
  translate(0, sproutPositionY);
  scale(size);
  
  // Makes it spin
  rotate(frameCount * 0.01);
  let flowerColor = color;
  
  // Brown center
  fill(139, 69, 19);
  ellipse(0, 0, 25, 25);

  // Petals
  push();
  for (let i = 0; i < 5; i++) {
    rotate(TWO_PI / 5);
    fill(flowerColor);
    ellipse(15, 0, 12, 30);
  }
  pop();
  pop();
}

// I learned how to use all colors in the color spectrum. Found this online.
function randomSunflowerColor() {
  // Set the color mode to HSB for full control over color variation
  colorMode(HSB, 360, 100, 100);
  // Generate random hue across the full color spectrum (0 to 360)
  let hue = random(0, 360); // This allows for any color across the spectrum
  // Generate random saturation and brightness to create vibrant colors
  // Keeping saturation and brightness high for vivid and strong colors
  let saturation = random(80, 100);
  let brightness = random(80, 100);
  
  let sunflowerColor = color(hue, saturation, brightness);
  colorMode(RGB, 255);
  return sunflowerColor;
}

function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2);
}