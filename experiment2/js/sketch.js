let sun;
let planets = [];
let moon;
let stars = [];
let randomizeButton;

function setup() {
  let container = select('#canvas-container');
  let canvas = createCanvas(800, 600);

  if (container) {
    canvas.parent(container);
  } else {
    console.error("Canvas container not found!");
  }

  sun = createVector(width / 2, height / 2);

  // Planet properties: [distance (d), radius/size (r), color (c), speed]
  planets = [
    { name: 'Mercury', d: 50, r: 6, c: color(169, 169, 169), angle: 0, speed: 0.04, reverse: false },
    { name: 'Venus',   d: 80, r: 10, c: color(255, 228, 181), angle: 0, speed: 0.03, reverse: false },
    { name: 'Earth',   d: 110, r: 12, c: color(100, 149, 237), angle: 0, speed: 0.025, reverse: false },
    { name: 'Mars',    d: 150, r: 10, c: color(255, 99, 71), angle: 0, speed: 0.02, reverse: false },
    { name: 'Jupiter', d: 190, r: 20, c: color(205, 133, 63), angle: 0, speed: 0.015, reverse: false },
    { name: 'Saturn',  d: 230, r: 18, c: color(218, 165, 32), angle: 0, speed: 0.012, reverse: false },
    { name: 'Uranus',  d: 270, r: 14, c: color(173, 216, 230), angle: 0, speed: 0.01, reverse: false },
    { name: 'Neptune', d: 310, r: 14, c: color(72, 61, 139), angle: 0, speed: 0.008, reverse: false },
    { name: 'Pluto',   d: 345, r: 5, c: color(210, 180, 140), angle: 0, speed: 0.007, reverse: false }
  ];

  moon = {
    d: 20, r: 4, c: color(220), angle: 0, speed: 0.1
  };

  planets.forEach(p => {
    p.angle = random(TWO_PI);
    p.d += random(-5, 5);
  });

  generateStars();

  let button = select('#randomizeStars');
  if (button) {
    button.mousePressed(generateStars);
  } else {
    console.error("Randomize button not found!");
  }

}

function draw() {
  background(10, 10, 40);

  // Draw stars
  noStroke();
  fill(255);
  for (let s of stars) {
    ellipse(s.x, s.y, s.size);
  }

  // Draw sun
  noStroke();
  fill(255, 204, 0);
  ellipse(sun.x, sun.y, 40);

  // Draw dotted lines for planet paths
  noFill();
  stroke(255);
  strokeWeight(1);
  drawingContext.setLineDash([4, 4]);
  planets.forEach(p => {
    ellipse(sun.x, sun.y, p.d * 2);
  });
  drawingContext.setLineDash([]);

  // Draw planets
  planets.forEach(p => {
    let x = sun.x + cos(p.angle) * p.d;
    let y = sun.y + sin(p.angle) * p.d;

    // Mouse interaction
    let d = dist(mouseX, mouseY, x, y);
    if (d < 20) {
      p.reverse = true;
    } else {
      p.reverse = false;
    }

    p.angle += p.reverse ? -p.speed : p.speed;

    fill(p.c);
    noStroke();
    ellipse(x, y, p.r * 2);

    // Make moon orbit Earth
    if (p.name === 'Earth') {
      let moonX = x + cos(moon.angle) * moon.d;
      let moonY = y + sin(moon.angle) * moon.d;

      noFill();
      stroke(255);
      strokeWeight(0.5);
      drawingContext.setLineDash([2, 3]);
      ellipse(x, y, moon.d * 2);
      drawingContext.setLineDash([]);

      fill(moon.c);
      noStroke();
      ellipse(moonX, moonY, moon.r * 2);

      moon.angle += moon.speed;
    }

    // Draw rings around Saturn
    if (p.name === 'Saturn') {
      drawSaturnRings(x, y);
    }
  });
}


function drawSaturnRings(x, y) {
  push();
  translate(x, y);
  rotate(PI / -6); // Tilt the ring

  noFill();
  stroke(200, 200, 100, 80); // Ring color with some transparency
  strokeWeight(1);

  // Draw multiple concentric ellipses to simulate ring thickness
  for (let rOffset = 0; rOffset < 6; rOffset++) {
    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.1) {
      let rx = cos(a) * (25 + rOffset);   // increase outer radius slightly
      let ry = sin(a) * (10 + rOffset * 0.4); // scale y for perspective
      vertex(rx, ry);
    }
    endShape(CLOSE);
  }

  pop();
}


function generateStars() {
  stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3)
    });
  }
}