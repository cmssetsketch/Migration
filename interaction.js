const SHAPE_RATIO = 500; // 1 shape = 200 people
const MAX_ZOOM = 8;

function getVisibleWorldBounds(p) {
  const left   = (-panX) / zoom;
  const top    = (-panY) / zoom;
  const right  = (p.width - panX) / zoom;
  const bottom = (p.height - panY) / zoom;

  return { left, right, top, bottom };
}


function showData(b) {
  
  const popUp = document.getElementById("popUp");
  if (!popUp) return;
  popUp.style.display = "block";
  popUp.innerHTML = "";
  b = selectedButton;
  if (!b.dataMig2024) return;

// ── LIST LEGEND
const list = document.createElement("div");
list.className = "migration-list";

// 1. Sort everything first
// ── 1. Sort all destinations by value
const sortedEntries = Object.entries(b.dataMig2024 || {})
  .sort((a, b) => b[1] - a[1]);

// --- 2. Start with squares that actually exist
let squareEntries = sortedEntries.filter(([dest]) =>
  b.shapeSquares.some(sq => sq.destName === dest)
);


let displayEntries;

if (isEverybodyMode) {
  const migrantDestinations = new Set(
    b.shapeSquares
      .filter(sq => sq.destName !== b.originalName)
      .map(sq => sq.destName)
  );

  //only destinations with squares
  const filtered = squareEntries.filter(([dest]) =>
    migrantDestinations.has(dest)
  );

  squareEntries = filtered; // used for drawing

  // if nothing left, show first entry as text
  if (filtered.length === 0 && sortedEntries.length > 0) {
    displayEntries = [sortedEntries[0]]; // text-only entry
  } else {
    displayEntries = filtered;
  }
} else {// Not EverybodyMode → display what we have
  
  displayEntries = sortedEntries;;
}



// Build the rows
for (const [dest, value] of displayEntries) {
  const row = document.createElement("div");
  row.className = "migration-row";

  const shapeWrapper = document.createElement("div");
  shapeWrapper.className = "shape-wrapper";

  const shapeId = countryToShape[dest];
  const color = getColorForCountry(dest);
  const shape = createCountryShapeSVG(shapeId, color, 16);
  shapeWrapper.appendChild(shape);

  const textDiv = document.createElement("div");
  textDiv.className = "migration-text";
textDiv.innerHTML = `
  <div class="migration-dest long-name">${t(`countries.${dest}`)}</div>
  <div class="migration-value">${value.toLocaleString('fr-FR')}</div>
`;

  row.appendChild(shapeWrapper);
  row.appendChild(textDiv);
  list.appendChild(row);
}

// Get the color for the country
const color = getColorForCountry(b.originalName);

// ── HEADER: shape + name + population
// Create header div
const header = document.createElement("div");
header.className = "popup-header";

const shape = createCountryShapeSVG(countryToShape[b.originalName], color, 24);
const topRow = document.createElement("div");
topRow.className = "popup-top-row";
topRow.style.position = "relative";
topRow.appendChild(shape);

const namePop = document.createElement("div");
  namePop.style.position = "relative";
  const popValue = isEverybodyMode ? b.population2024 : b.migTotalRaw;
  const popLabel = isEverybodyMode ? "Population :" : "Migrants :";
let millionsText = "";

// Kosovo special case ONLY when EverybodyMode is OFF
if (!isEverybodyMode && b.originalName === "Kosovo") {
  millionsText = t("legend.noData") ?? "no data";
} else {
  const popValue = isEverybodyMode ? b.population2024 : b.migTotalRaw;
  const popLabel = isEverybodyMode ? "Population :" : "Migrants :";

  if (popValue * 1000 >= 1_000_000) {
    const millions = popValue / 1000;

    const formattedMillions =
      Number.isInteger(millions)
        ? millions.toString()
        : millions.toFixed(1).replace(/\.0$/, "");

    millionsText =
      formattedMillions.replace(".", ",") +
      " million" +
      (millions > 1 ? "s" : "");
  } else {
    millionsText = Math.round(popValue * 1000).toLocaleString("fr-FR");
  }
}
const nameDiv = document.createElement("div");
nameDiv.className = "popup-title long-name";
nameDiv.style.color = color;
nameDiv.textContent = t(`countries.${b.originalName}`);
namePop.appendChild(nameDiv);

// Add note star + bubble
const star = createCitizenNotes(b.originalName, namePop);
if (star) nameDiv.appendChild(star);
// topRow shape + name
topRow.appendChild(namePop);

// ── population below topRow
const popDiv = document.createElement("div");
popDiv.className = "popup-sub";
popDiv.innerHTML = `${popLabel} ${millionsText}`;


const migInfo = document.createElement("div");
migInfo.className = "mig-info";

const line = document.createElement("span");

if (b.originalName === "Kosovo") {
  line.textContent = t("legend.noData") ?? "no data";
} else if (isEverybodyMode) {
  line.textContent = `${t("legend.including")} ${b.migShare2024} ${t("legend.migrant")}`;
} else {
  line.textContent = "";
}

migInfo.appendChild(line);

function getCitizenByCountry(countryName) {
const letters = citizenData.types[countryName];
  if (!letters || !letters.length) return null;

  const statusDiv = document.createElement("div");
  statusDiv.className = "citizen-status";
  statusDiv.textContent = buildLegendFromLetters(letters, "or");

  return statusDiv;
}


const citizenDiv = getCitizenByCountry(b.originalName);
function createCitizenNotes(countryName, namePop) {
  const key = `notes.${countryName}`;
  const noteText = t(key);

  if (!noteText || noteText === key) return null; // no note

  // Inline star
  const star = document.createElement("span");
  star.textContent = "*";
  star.className = "notes-star";

  // Bubble — separate div appended to popup container
  const bubble = document.createElement("div");
  bubble.className = "notes-bubble";
  bubble.innerHTML = noteText;


  topRow.appendChild(bubble);

  // Show/hide on hover
  star.addEventListener("mouseenter", () => bubble.style.display = "block");
  star.addEventListener("mouseleave", () => bubble.style.display = "none");

  return star; // only the star is appended inline
}

// Build and inject header
header.appendChild(topRow);
  header.appendChild(popDiv);
  if (isEverybodyMode&& b.originalName !== "Kosovo"){
  migInfo.appendChild(citizenDiv);
    header.appendChild(migInfo);
  }

  popUp.prepend(header);
popUp.appendChild(list);


}


function createCountryShapeSVG(shapeId, color, size = 24) {
  const xml = shapeSVGs[shapeId];
  if (!xml) return null;

  const children = getSVGShapes(xml);
  if (!children.length) return null;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("viewBox", "0 0 2 2");

  for (let node of children) {
    const type = node.getName();

    if (type === "polygon") {
      const el = document.createElementNS(svg.namespaceURI, "polygon");
      el.setAttribute("points", node.getString("points"));
      el.setAttribute("fill", color);
      svg.appendChild(el);

    } else if (type === "rect") {
      const el = document.createElementNS(svg.namespaceURI, "rect");
      el.setAttribute("x", node.getNum("x"));
      el.setAttribute("y", node.getNum("y"));
      el.setAttribute("width", node.getNum("width"));
      el.setAttribute("height", node.getNum("height"));
      el.setAttribute("fill", color);
      svg.appendChild(el);

    } else if (type === "path") {
      const el = document.createElementNS(svg.namespaceURI, "path");
      el.setAttribute("d", node.getString("d"));
      el.setAttribute("fill", color);
      svg.appendChild(el);
    }
  }

  return svg;
}


function drawSelect(p, selectedButton) {
  p.background(0);
  p.push();
  p.translate(panX, panY);
  p.scale(zoom);

  const BASE_CELL = 2;

// --------------------------------
  // Draw outlines for all countries
  buttons.forEach(b => {
    const color = getColorForCountry(b.originalName);
    b.shapes.forEach(s => drawShapeOutline(p, s, color));
  });

  if (!selectedButton) {
    p.pop();
    return;
  }

  // -----------------------
// Get squares of selected button
  const squares = selectedButton.visibleShapeSquares ?? selectedButton.shapeSquares ?? [];
  if (!squares.length) {
    p.pop();
    return;
  }

// -----------------------
  // Determine aggregation factor
  const aggFactor = zoom < 3 ? getAggregationFactor(zoom) : 1;
  const CELL_SIZE = BASE_CELL * aggFactor;

// -----------------------
  // Build aggregated cells if zoom < 3
  let cellsMap;
  if (aggFactor > 1) {
    cellsMap = new Map();
    const { minX, minY } = getButtonBounds(selectedButton);

    for (const sq of squares) {
      const cx = Math.floor((sq.x - minX) / CELL_SIZE);
      const cy = Math.floor((sq.y - minY) / CELL_SIZE);
      const key = `${cx},${cy}`;

      if (!cellsMap.has(key)) {
        cellsMap.set(key, {
          x: minX + cx * CELL_SIZE,
          y: minY + cy * CELL_SIZE,
          counts: new Map()
        });
      }

      const cell = cellsMap.get(key);
      const destKey = sq.shapeId + "|" + sq.color;
      cell.counts.set(destKey, (cell.counts.get(destKey) || 0) + 1);
    }
  }

  // -----------------------
  // Draw squares
  const drawCells = aggFactor > 1 ? Array.from(cellsMap.values()) : squares;

  drawCells.forEach(cell => {
    let cx, cy, counts;
    if (aggFactor > 1) {
      cx = cell.x;
      cy = cell.y;
      // pick the dominant square in the cell
      let bestKey = null, bestCount = 0;
      for (const [k, c] of cell.counts) {
        if (c > bestCount) {
          bestCount = c;
          bestKey = k;
        }
      }
      if (!bestKey) return;
      const [shapeId, color] = bestKey.split("|");
      counts = { shapeId, color };
    } else {
      cx = cell.x;
      cy = cell.y;
      counts = { shapeId: cell.shapeId, color: cell.color };
    }

    const xml = shapeSVGs[counts.shapeId];
    if (!xml) return;
    const children = getSVGShapes(xml);
    if (!children.length) return;

    p.push();
    p.translate(cx, cy);
    p.noStroke();
    p.fill(counts.color);

    const scaleFactor = CELL_SIZE / BASE_CELL;

    children.forEach(node => {
      const type = node.getName();
      if (type === "polygon") {
        const nums = node.getString("points").replace(/,/g, " ").trim().split(/\s+/).map(Number);
        p.beginShape();
        for (let i = 0; i < nums.length; i += 2) {
          p.vertex(nums[i] * scaleFactor, nums[i + 1] * scaleFactor);
        }
        p.endShape(p.CLOSE);
      } else if (type === "rect") {
        const x = parseFloat(node.getString("x")) || 0;
        const y = parseFloat(node.getString("y")) || 0;
        const w = parseFloat(node.getString("width")) || 0;
        const h = parseFloat(node.getString("height")) || 0;
        p.rect(x * scaleFactor, y * scaleFactor, w * scaleFactor, h * scaleFactor);
      } else if (type === "path") {
        const d = node.getString("d");
        if (!d) return;
        const path = new Path2D(d);
        const ctx = p.drawingContext;
        ctx.save();
        ctx.scale(scaleFactor, scaleFactor);
        ctx.fillStyle = counts.color;
        ctx.fill(path, "evenodd");
        ctx.restore();
      }
    });

    p.pop();
  });

  p.pop();
}



let zoomRedrawPending = false;

const everybodyBtn = document.getElementById("toggle-everybody");
const migrantBtn = document.getElementById("toggle-migrant");

function setMode(everybody) {
  isEverybodyMode = everybody;
  everybodyBtn.classList.toggle("active", everybody);
  migrantBtn.classList.toggle("active", !everybody);
}

const infoBtn = document.getElementById("info-btn");
const popInfo = document.getElementById("popInfo");


function togglePopInfo(forceOpen = false) {
  const isOpen = forceOpen || !popInfo.classList.contains("active");

  if (isOpen) {
    showPopInfo();
    popInfo.classList.add("active");
    infoBtn.classList.add("active");
  } else {
    popInfo.classList.remove("active");
    infoBtn.classList.remove("active");
  }
}

infoBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  togglePopInfo();
});

function updateLangButtons(lang) {
  document.querySelector(".fr-btn").classList.toggle("active", lang === "fr");
  document.querySelector(".en-btn").classList.toggle("active", lang === "en");
}

function setupInteractions(p) {
  const mapContainer = document.getElementById("map-container");
  
  const pointers = new Map();
  let lastPinchDist = null;
  let tapStart = null;

  function handleMapTap(e) {
  const rect = mapContainer.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  let clickedCountry = false;

  buttons.forEach(b => {
    if (pointInsideButton(x, y, b)) {
      clickedCountry = true;
      selectedButton = b; // ✅ store current button
      showData(b);
      document.getElementById("popUp").style.display = "block";
    }
  });

  if (!clickedCountry) {
    selectedButton = null;
    document.getElementById("popUp").style.display = "none";
  }

  requestSafeRedraw(p);
}
  // ---------------- BUTTONS ----------------


everybodyBtn.addEventListener("click", () => {
  setMode(true);
  buttons.forEach(b => generateSquaresForButton(b));
  
  if (selectedButton) showData(selectedButton); // refresh popup for current button
  p.redraw();
});

migrantBtn.addEventListener("click", () => {
  setMode(false);
  buttons.forEach(b => generateSquaresForButton(b));
  
  if (selectedButton) showData(selectedButton); // refresh
  p.redraw();
});


// -------------------- ZOOM BUTTONS --------------------
document.querySelectorAll(".zoom-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const factor = btn.dataset.zoom === "in" ? 1.2 : 1 / 1.2;
    applyZoom(p, factor, p.width / 2, p.height / 2);
  });
});


 mapContainer.addEventListener(
    "wheel",
    e => {
      if (e.target.closest("#popUp") || e.target.closest("#popInfo")) return;
      e.preventDefault();

      const rect = mapContainer.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const stepFactor = 1.2;
      const factor = e.deltaY < 0 ? stepFactor : 1 / stepFactor;

      applyZoomStep(p, factor, mouseX, mouseY);
    },
    { passive: false }
  );



  // ---------------- POINTER INTERACTIONS ----------------
  mapContainer.addEventListener("pointerdown", e => {
    if (e.target.closest("#popUp") || e.target.closest("#popInfo")) return;

    mapContainer.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, e);

    tapStart = { x: e.clientX, y: e.clientY, time: performance.now() };
  });

  mapContainer.addEventListener("pointermove", e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, e);

    const pts = Array.from(pointers.values());

    // 🟢 PAN (1 pointer)
    if (pts.length === 1) {
      panX += e.movementX;
      panY += e.movementY;
      requestSafeRedraw(p);
    }

    // 🔵 PINCH (2 pointers)
    if (pts.length === 2) {
      const [a, b] = pts;
      const rect = mapContainer.getBoundingClientRect();

      const ax = a.clientX - rect.left;
      const ay = a.clientY - rect.top;
      const bx = b.clientX - rect.left;
      const by = b.clientY - rect.top;

      const dist = Math.hypot(bx - ax, by - ay);

      if (lastPinchDist !== null) {
        const zoomIntensity = 0.002;
        const factor = Math.exp((dist - lastPinchDist) * zoomIntensity);
        const cx = (ax + bx) / 2;
        const cy = (ay + by) / 2;

        applyZoom(p, factor, cx, cy); // smooth pinch zoom
      }

      lastPinchDist = dist;
    }
  });

  mapContainer.addEventListener("pointerup", e => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) lastPinchDist = null;

    // TAP detection
    if (tapStart) {
      const dx = e.clientX - tapStart.x;
      const dy = e.clientY - tapStart.y;
      const dt = performance.now() - tapStart.time;

      if (Math.hypot(dx, dy) < 6 && dt < 250) {
        handleMapTap(e); // step zoom + select
      }
    }

    tapStart = null;
  });

  mapContainer.addEventListener("pointercancel", () => {
    pointers.clear();
    lastPinchDist = null;
    tapStart = null;
  });
}

// ---------------- ZOOM FUNCTIONS ----------------
let zoomVelocity = 0;
let zoomAnchorX = 0;
let zoomAnchorY = 0;
const ZOOM_FRICTION = 0.85;
const ZOOM_SPEED = 0.002;

function applyZoomStep(p, factor, screenX, screenY) {
  if (!buttonsReady) return;

  const prevZoom = zoom;
  zoom *= factor;
  zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

  const wx = (screenX - panX) / prevZoom;
  const wy = (screenY - panY) / prevZoom;

  panX = screenX - wx * zoom;
  panY = screenY - wy * zoom;

  requestSafeRedraw(p);
}

function applyZoom(p, factor, screenX, screenY) {
  // Smooth pinch zoom
  zoomVelocity += Math.log(factor);
  zoomAnchorX = screenX;
  zoomAnchorY = screenY;
  p.loop();
}

function requestSafeRedraw(p) {
  if (zoomRedrawPending) return;
  zoomRedrawPending = true;
  requestAnimationFrame(() => {
    zoomRedrawPending = false;
    p.redraw();
  });
}

// -------------------- POPINFO CONTENT --------------------
function showPopInfo() {
  // Clear and create main HTML with minimal heavy DOM
  popInfo.innerHTML = `
    <span id="welcome">${t("popInfo.statland")}</span><br>
    <span id="disclaimer">${t("popInfo.disclaimer")}</span>
<div id="popGeography" class="geography-map"></div>
    <span id="geography">${t("popInfo.geography")}</span><br>
    
    <span id="originCountry"></span><br>
<span id="region">${t("popInfo.particles")}</span><br>
    <div id="particlesAnim"></div>
     <span id="motif">${t("popInfo.motif")}</span><br>
    <div id="patternLines"></div>
    <span id="decision">${t("popInfo.decision")}</span><br>
    <div id="popDecision" class="decision-img"></div>
   <span id="criteres">${t("popInfo.criteres")}</span><br>
    <div id="popCritere" class="criteres-img"></div>
    <span id="migrant">${t("popInfo.migrant")}</span><br>
    <div id="popMigrant" class="migrant-img"></div>
    
    <div id="popContact" class="popContact"></div>
    <div class="info-icons">
      <a href="mailto:cmsset@gmail.com"><img src="mail.svg"></a>
      <a href="https://chloe-msset.com/art" target="_blank"><img src="web-Icon.svg"></a>
      <a href="https://www.instagram.com/chloemsset/" target="_blank"><img src="instagram-icon.svg"></a>
    </div>
  `;

  // Helper to add static images
  function addImg(containerId, src, className, padding = 10) {
    const container = document.getElementById(containerId);
    const img = document.createElement("img");
    img.src = src;
    img.alt = className;
    img.className = className;
    container.appendChild(img);
    container.style.paddingTop = `${padding}px`;
    container.style.paddingBottom = `${padding}px`;
  }

  addImg("popGeography", "geographymapsquare.png", "geography-map");
  addImg("popDecision", "decision.png", "decision-img");
  addImg("popMigrant", "migrant.png", "migrant-img");
  addImg("popCritere", "criteres.png", "criteres-img");
  addImg("popContact", "me-Icon-White.png", "contact-image", 0);

  // ------------------- Origin country -------------------
  const originContainer = document.getElementById("originCountry");
  if (originContainer && buttons.length > 0) {
    function updateRandomCountry() {
      const b = buttons[Math.floor(Math.random() * buttons.length)];
      const shapeId = countryToShape[b.originalName];
      const color = getColorForCountry(b.originalName);

      originContainer.innerHTML = "";
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.alignItems = "center";

      const shape = createCountryShapeSVG(shapeId, color, 28);
      shape.style.pointerEvents = "none";
      shape.style.fill = color;

      const label = document.createElement("span");
      label.textContent =
  langdata[currentLang]?.countries?.[b.originalName] ?? b.originalName;
      label.style.fontSize = "12px";
      label.style.color = color;
      label.style.paddingTop = "5px";

      wrapper.append(shape, label);
      originContainer.appendChild(wrapper);
    }

    updateRandomCountry();
    setInterval(updateRandomCountry, 2000);
  }

  // ------------------- Pattern lines -------------------
  const patternContainer = document.getElementById("patternLines");
  patternContainer.style.display = "flex";
  patternContainer.style.flexDirection = "column";
  patternContainer.style.alignItems = "center";
 
function createMiniShapeBlock(shapeId, color, size = 10) {
    const block = document.createElement("div");
    block.style.width = `${size}px`;
    block.style.height = `${size}px`;
    block.style.display = "flex";
    block.style.alignItems = "center";
    block.style.justifyContent = "center"; // centers the svg inside
    const shape = createCountryShapeSVG(shapeId, color, size);
    shape.style.display = "block"; // removes inline baseline issue
    block.appendChild(shape);
    return block;
}
  const mainButton = buttons[Math.floor(Math.random() * buttons.length)];
  const mainShapeId = countryToShape[mainButton.originalName];
  const mainColor = getColorForCountry(mainButton.originalName);

const frameDiv = document.createElement("div");
frameDiv.style.display = "inline-block";       // or flex if you prefer
frameDiv.style.verticalAlign = "middle";          // fixes baseline issue
frameDiv.style.border = `1px solid ${mainColor}`;
frameDiv.style.boxSizing = "border-box";       // include padding in frame size
frameDiv.style.height = "fit-content";

const fragment = document.createDocumentFragment();
for (let lineIndex = 0; lineIndex < 4; lineIndex++) {
  const lineDiv = document.createElement("div");
  lineDiv.style.display = "flex";
  for (let i = 0; i < 20; i++) {
    let shapeId = mainShapeId;
    let color = mainColor;
    if (Math.random() < 0.2) {
      const rnd = buttons[Math.floor(Math.random() * buttons.length)];
      shapeId = countryToShape[rnd.originalName];
      color = getColorForCountry(rnd.originalName);
    }
    lineDiv.appendChild(createMiniShapeBlock(shapeId, color));
  }
  fragment.appendChild(lineDiv);
}

frameDiv.appendChild(fragment);
patternContainer.appendChild(frameDiv);

const particlesAnim = document.getElementById("particlesAnim");

const particleBlock = document.createElement("div");
  particleBlock.id = "particleBlock"; 
const containerWidth = 250;
const containerHeight = containerWidth * 0.2;

particleBlock.style.position = "relative";
particleBlock.style.width = `${containerWidth}px`;
particleBlock.style.height = `${containerHeight}px`;
particleBlock.style.overflow = "hidden";

particlesAnim.appendChild(particleBlock);

  const particleCount = 10;
  const particles = [];
  const size = 8;

  // Create particles once
  for (let i = 0; i < particleCount; i++) {
    const b = buttons[Math.floor(Math.random() * buttons.length)];
    const shapeId = countryToShape[b.originalName];
    const color = getColorForCountry(b.originalName);

const shape = createCountryShapeSVG(shapeId, color, size);
shape.style.position = "absolute";
shape.style.pointerEvents = "none";
shape.style.display = "block";
shape.style.transformOrigin = "0 0";
    const x =
  ((i + Math.random()) / particleCount) * (containerWidth - size);
    const y = Math.random() * (containerHeight - size);
    shape.style.left = `${x}px`;
shape.style.top = `${y}px`;
    particleBlock.appendChild(shape);

    particles.push({
      el: shape,
      x,
      y,
     vx: (Math.random() * 2 - 1) * 0.2,
vy: (Math.random() * 2 - 1) * 0.2,
    });
  }

  // Animate particles using transform only
  function updateParticles() {
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) {
  p.x = 0;
  p.vx *= -1;
} else if (p.x > containerWidth - size) {
  p.x = containerWidth - size;
  p.vx *= -1;
}

if (p.y < 0) {
  p.y = 0;
  p.vy *= -1;
} else if (p.y > containerHeight - size) {
  p.y = containerHeight - size;
  p.vy *= -1;
}

      // Occasionally change color/shape, but reuse element
      if (Math.random() < 0.001) {
        const b = buttons[Math.floor(Math.random() * buttons.length)];
        const newShapeId = countryToShape[b.originalName];
        const newColor = getColorForCountry(b.originalName);

        const newShape = createCountryShapeSVG(newShapeId, newColor, size);
        newShape.style.position = "absolute";
        newShape.style.transform = `translate(${p.x}px, ${p.y}px)`;
        newShape.style.pointerEvents = "none";

        particleBlock.replaceChild(newShape, p.el);
        p.el = newShape;
      }

      p.el.style.left = `${p.x}px`;
p.el.style.top = `${p.y}px`;
    });

    requestAnimationFrame(updateParticles);
  }

  updateParticles();
}

/*function defaultShapeSVG() {
  return `
    <svg viewBox="0 0 10 10">
      <rect x="0" y="0" width="2" height="2" fill="#888"/>
    </svg>
  `;
}*/



document.addEventListener("click", (e) => {
  // don't close if clicking inside popup or on info button
  if (
    popInfo.classList.contains("active") && 
    !popInfo.contains(e.target) &&
    e.target !== infoBtn &&
    !e.target.closest(".fr-btn") &&  // <- ignore language buttons
    !e.target.closest(".en-btn")
  ) {
    togglePopInfo(false);
    
  }
});

function openPopUpForCountry(b) {
  selectedButton = b;       // save the selected country
  popInfo.classList.add("active");
  showPopInfo();
  showData(b);              // normal usage
}

function buildLegendFromLetters(letters, joinType = "or") {
  const lang = langdata[currentLang];
  if (!lang) return "";

  const labels = letters
    .map(letter => lang.letters[letter])
    .filter(Boolean);

  if (labels.length === 0) return "";
  if (labels.length === 1) return `(${lang.conjunctions.start}${labels[0]}.)`;

  if (labels.length === 2) {
    return `(${lang.conjunctions.start}\n${labels[0]} ${lang.conjunctions[joinType]} ${labels[1]})`;
  }

  return (
    labels.slice(0, -1).join(", ") +
    ` ${lang.conjunctions[joinType]} ` +
    labels[labels.length - 1]
  );
}


