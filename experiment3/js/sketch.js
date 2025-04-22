/* exported preload, setup, draw, placeTile */
/* global generateGrid drawGrid */

let seed = 0;
let tilesetImage;
let currentGrid = [];
let numRows, numCols;
let mode = "dungeon";

function preload() {
  tilesetImage = loadImage(
    "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438"
  );
}

function reseed() {
  seed = (seed | 0) + 1109;
  randomSeed(seed);
  noiseSeed(seed);
  select("#seedReport").html("seed " + seed);
  regenerateGrid();
}

function regenerateGrid() {
  select("#asciiBox").value(gridToString(generateGrid(numCols, numRows)));
  reparseGrid();
}

function reparseGrid() {
  currentGrid = stringToGrid(select("#asciiBox").value());
}

function gridToString(grid) {
  let rows = [];
  for (let i = 0; i < grid.length; i++) {
    rows.push(grid[i].join(""));
  }
  return rows.join("\n");
}

function stringToGrid(str) {
  let grid = [];
  let lines = str.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let row = [];
    let chars = lines[i].split("");
    for (let j = 0; j < chars.length; j++) {
      row.push(chars[j]);
    }
    grid.push(row);
  }
  return grid;
}

function setup() {
  numCols = select("#asciiBox").attribute("rows") | 0;
  numRows = select("#asciiBox").attribute("cols") | 0;

  createCanvas(16 * numCols, 16 * numRows).parent("canvasContainer");
  select("canvas").elt.getContext("2d").imageSmoothingEnabled = false;

  select("#reseedButton").mousePressed(reseed);
  select("#asciiBox").input(reparseGrid);
  reseed();
}


function draw() {
  randomSeed(seed);
  drawGrid(currentGrid);
}

function placeTile(i, j, ti, tj) {
  image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
}


/* 
-----------------------------------------------
*/


// Dungeon mode lookup array. I picked a few tiles for each.
const dungeonLookup = {
    wall: [
        [11, 21], [11, 22], [11, 23], [11, 24]
    ],
    floor: [
        [0, 3], [1, 3], [2, 3], [3, 3]
    ]
};

// Overworld mode lookup arrays.
const overworldLookup = {
    grass: [
      [0, 0], [1, 0], [2, 0], [3, 0]
    ],
    water: [
      [0, 13], [1, 13], [2, 13], [3, 13]
    ],
    tree: [
      [14, 0], [14, 6], [16, 2], [17, 8]
    ]
};


function pickTile(tileOptions) {
    return random(tileOptions);
}
  

// GRID GENERATION AND DRAWING

function generateGrid(numCols, numRows) {
  if (mode === "dungeon") {
    return generateDungeonGrid(numCols, numRows);
  } else {
    return generateOverworldGrid(numCols, numRows);
  }
}

function drawGrid(grid) {
  if (mode === "dungeon") {
    drawDungeonGrid(grid);
  } else {
    drawOverworldGrid(grid);
  }
}

// DUNGEON MODE 
function generateDungeonGrid(numCols, numRows) {
  let grid = [];
  for (let i = 0; i < numRows; i++) {
    let row = [];
    for (let j = 0; j < numCols; j++) {
      row.push("_"); // background
    }
    grid.push(row);
  }

  let rooms = [];
  let attempts = 0;
  while (rooms.length < 20 && attempts < 70) {
    let w = floor(random(4, 10));
    let h = floor(random(4, 10));
    let x = floor(random(1, numCols - w - 1));
    let y = floor(random(1, numRows - h - 1));

    let overlaps = false;
    for (let room of rooms) {
      if (x < room.x + room.w + 2 && x + w + 2 > room.x &&
          y < room.y + room.h + 2 && y + h + 2 > room.y) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      rooms.push({ x, y, w, h });
      for (let i = y; i < y + h; i++) {
        for (let j = x; j < x + w; j++) {
          grid[i][j] = "."; // floor
        }
      }
    }
    attempts++;
  }

  // Hallways
  for (let i = 1; i < rooms.length; i++) {
    let r1 = rooms[i - 1];
    let r2 = rooms[i];
    let x1 = floor(r1.x + r1.w / 2);
    let y1 = floor(r1.y + r1.h / 2);
    let x2 = floor(r2.x + r2.w / 2);
    let y2 = floor(r2.y + r2.h / 2);

    if (random() < 0.5) {
      for (let x = min(x1, x2); x <= max(x1, x2); x++) grid[y1][x] = ".";
      for (let y = min(y1, y2); y <= max(y1, y2); y++) grid[y][x2] = ".";
    } else {
      for (let y = min(y1, y2); y <= max(y1, y2); y++) grid[y][x1] = ".";
      for (let x = min(x1, x2); x <= max(x1, x2); x++) grid[y2][x] = ".";
    }
  }

  return grid;
}

function drawDungeonGrid(grid) {
  background(20);
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      let cell = grid[i][j];
      if (cell === ".") {
        let [tx, ty] = pickTile(dungeonLookup.floor);
        placeTile(i, j, tx, ty);
      } else {
        let [tx, ty] = pickTile(dungeonLookup.wall);
        placeTile(i, j, tx, ty);
      }
    }
  }
  drawDungeonAmbientOverlay();
  drawDungeonGlow(grid);
}

function drawDungeonAmbientOverlay() {
  noStroke();
  let t = millis() * 0.002;
  let baseAlpha = 60 + 20 * sin(t * 2);
  let offsetX = 5 * sin(t * 0.5);
  let offsetY = 5 * cos(t * 0.5);
  fill(0, 0, 0, baseAlpha);
  rect(offsetX, offsetY, width, height);
}

function drawDungeonGlow(grid) {
  let glowRadius = 48;
  let glowStrength = 100;

  noStroke();
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      let x = j * 16 + 8;
      let y = i * 16 + 8;

      // Only affect floor tiles
      if (grid[i][j] === ".") {
        let d = dist(mouseX, mouseY, x, y);
        if (d < glowRadius) {
          let alpha = map(d, 0, glowRadius, glowStrength, 0);
          fill(255, 255, 100, alpha);
          rect(j * 16, i * 16, 16, 16);
        }
      }
    }
  }
}



  

// OVERWORLD MODE 
function generateOverworldGrid(numCols, numRows) {
  let grid = [];
  for (let i = 0; i < numRows; i++) {
    let row = [];
    for (let j = 0; j < numCols; j++) {
      let n = noise(i * 0.1, j * 0.1);
      if (n < 0.3) row.push("w"); // water
      else if (n < 0.6) row.push("g"); // grass
      else row.push("t"); // tree
    }
    grid.push(row);
  }
  return grid;
}

function drawOverworldGrid(grid) {
  background("#00e232");
  let time = millis() * 0.002;
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      let code = grid[i][j];
      let tile;
      if (code === "g") {
        tile = pickTile(overworldLookup.grass);
      } else if (code === "w") {
        tile = pickTile(overworldLookup.water);
        
      } else if (code === "t") {
        tile = pickTile(overworldLookup.tree);
      }
      if (tile) {
        let [tx, ty] = tile;
        placeTile(i, j, tx, ty);
      }
    }
  }
  drawWaterPulseOverlay(grid);
}

function drawWaterPulseOverlay(grid) {
  let t = millis() * 0.002;
  noStroke();
  blendMode(BLEND);
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      if (grid[i][j] === "w") {
        let alpha = 60 + 40 * sin(t + i * 0.4 + j * 0.4);
        fill(0, 0, 100, alpha);
        rect(j * 16, i * 16, 16, 16);
      }
    }
  }
  blendMode(BLEND);
}


// BUTTON
function setupModeToggleButton() {
  let toggleButton = createButton("Switch Mode");
  toggleButton.parent("modeToggleContainer");
  toggleButton.mousePressed(() => {
    mode = mode === "dungeon" ? "overworld" : "dungeon";
    reseed();
  });
}

if (typeof setup === 'function') {
  const originalSetup = setup;
  setup = function () {
    originalSetup();
    setupModeToggleButton();
  }
}