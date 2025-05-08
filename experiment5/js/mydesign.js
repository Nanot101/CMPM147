/* exported p4_inspirations, p4_initialize, p4_render, p4_mutate */

function getInspirations() {
  return [
    {
      name: "Solar System",
      assetUrl: "img/SolarSys147.jpg",
      credit: "Solar System"
    },
    {
      name: "Cave",
      assetUrl: "img/caveMine.jpg",
      credit: "Cave"
    },
    {
      name: "Crow",
      assetUrl: "img/crow2.jpg",
      credit: "crow"
    },
    {
      name: "Ship",
      assetUrl: "img/ship.jpg",
      credit: "ship"
    },
  ];
}

function initDesign(inspiration) {
  let scaleFactor = 1;
  if (inspiration.image.width > 500) {
    scaleFactor = 300 / inspiration.image.width;
  }

  let cw = inspiration.image.width * scaleFactor;
  let ch = inspiration.image.height * scaleFactor;
  resizeCanvas(cw, ch);

  $(".caption").text(inspiration.credit);

  const imgHTML = `<img src="${inspiration.assetUrl}" width="${cw}" />`;
  $('#original').empty();
  $('#original').append(imgHTML);

  inspiration.image.loadPixels();
  const edgeMask = sobelEdgeDetection(inspiration.image);

  // let design = { bg: 0, fg: [] };
  let design = { bg: 0, fg: [], edgeMask: edgeMask };
  const SCALE = scaleFactor;

  const shapeCount = 4000;
  for (let i = 0; i < shapeCount; i++) {
    let x, y;
    if (random(1) < 0.7) {
      // 70% chance to sample from edges
      let tries = 0;
      do {
        x = floor(random(width));
        y = floor(random(height));
        tries++;
      } while (edgeMask[(y / SCALE) * inspiration.image.width + (x / SCALE)] === 0 && tries < 20);
    } else {
      // 30% chance to sample randomly
      x = random(width);
      y = random(height);
    }

    const w = random(width / 50);
    const h = random(height / 50);

    design.fg.push({
      x: x,
      y: y,
      w: w,
      h: h,
      fill: getAvgBrightness(
        inspiration.image,
        { min: x / SCALE, max: (x + w) / SCALE },
        { min: y / SCALE, max: (y + h) / SCALE }
      ),
    });
  }
  design.fg.sort((a, b) => a.fill - b.fill);
  return design;
}


function getAvgBrightness(img, xRange, yRange) {
  let avg = 0;
  let count = 0;
  const width = img.width;
  const height = img.height;

  // Clamping the ranges to avoid out-of-bounds errors
  const minX = constrain(floor(xRange.min), 0, width - 1);
  const maxX = constrain(floor(xRange.max), 0, width - 1);
  const minY = constrain(floor(yRange.min), 0, height - 1);
  const maxY = constrain(floor(yRange.max), 0, height - 1);

  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const index = (y * width + x) * 4;
      if (index < img.pixels.length - 4) {
        const r = img.pixels[index];
        const g = img.pixels[index + 1];
        const b = img.pixels[index + 2];
        const brightness = (r + g + b) / 3;
        avg += brightness;
        count++;
      }
    }
  }

  return count > 0 ? avg / count : 128;  // Default to 128 if no valid pixels
}

function renderDesign(design, inspiration) {
background(design.bg);
noStroke();

design.fg.sort((a, b) => a.fill - b.fill);

// Batch rendering
for (let box of design.fg) {
  // Ensure the fill value is valid
  if (typeof box.fill === 'number' && !isNaN(box.fill)) {
    fill(box.fill, 255);
  } else {
    console.warn("Invalid fill color detected:", box.fill);
    fill(128, 255); // Fallback to a neutral gray
  }

  // Batch shapes together
  beginShape();
  if (box.fill < 100) {
    vertex(box.x, box.y);
    vertex(box.x + box.w, box.y);
    vertex(box.x + box.w, box.y + box.h);
    vertex(box.x, box.y + box.h);
  } else {
    for (let t = 0; t < TWO_PI; t += PI / 8) {
      const px = box.x + (box.w / 2) * cos(t);
      const py = box.y + (box.h / 2) * sin(t);
      vertex(px, py);
    }
  }
  endShape(CLOSE);
}
}




function mutateDesign(design, inspiration, rate) {
  design.bg = mut(design.bg, 0, 255, rate);
  const SCALE = width / inspiration.image.width;
  // const edgeMask = sobelEdgeDetection(inspiration.image);
  const edgeMask = design.edgeMask;

  for (let box of design.fg) {
    const offset = 2 + (10 * (1 - rate)); 

    const edgeValue = edgeMask[
      floor(box.y / SCALE) * inspiration.image.width + floor(box.x / SCALE)
    ];

    // If it's near an edge, reduce mutation amount
    const mutationFactor = edgeValue ? 0.5 : 1;

    box.x = mut(box.x, box.x - offset * mutationFactor, box.x + offset * mutationFactor, rate);
    box.y = mut(box.y, box.y - offset * mutationFactor, box.y + offset * mutationFactor, rate);
    box.w = mut(box.w, box.w - offset, box.w + offset, rate);
    box.h = mut(box.h, box.h - offset, box.h + offset, rate);

    if (Math.floor(random(20)) === 0) {
      box.fill = getAvgBrightness(
        inspiration.image,
        { min: box.x / SCALE, max: (box.x + box.w) / SCALE },
        { min: box.y / SCALE, max: (box.y + box.h) / SCALE }
      );
    }
  }
  design.fg.sort((a, b) => a.fill - b.fill);
}



function mut(num, min, max, rate) {
  return constrain(randomGaussian(num, (rate * (max - min)) / 20), min, max);
}


function sobelEdgeDetection(img) {
  img.loadPixels();
  const width = img.width;
  const height = img.height;

  let edgeMask = new Array(width * height).fill(0);

  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let pixelX = 0;
      let pixelY = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const ix = (y + ky) * width + (x + kx);
          const gray = (img.pixels[ix * 4] + img.pixels[ix * 4 + 1] + img.pixels[ix * 4 + 2]) / 3;
          pixelX += gray * sobelX[(ky + 1) * 3 + (kx + 1)];
          pixelY += gray * sobelY[(ky + 1) * 3 + (kx + 1)];
        }
      }

      const magnitude = sqrt(pixelX * pixelX + pixelY * pixelY);
      edgeMask[y * width + x] = magnitude > 128 ? 1 : 0; // Edge threshold
    }
  }
  return edgeMask;
}
