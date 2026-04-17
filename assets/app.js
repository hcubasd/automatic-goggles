let objective = "cost";
let itemId = 0;
let vehicleId = 0;

const seedItems = [
  { w: 10000, l: 1.5 },
  { w: 12000, l: 1.8 },
  { w: 8000, l: 1.4 },
  { w: 15000, l: 2.2 },
  { w: 9000, l: 1.6 }
];

const seedVehicles = [
  { name: "Classe_A", W: 15000, L: 5.0, wmin: 10000, gap: 0.2, fleet: 10 },
  { name: "Classe_B", W: 35000, L: 14.0, wmin: 25000, gap: 0.5, fleet: 2 }
];

function renumber(bodyId) {
  document.querySelectorAll(`#${bodyId} tr`).forEach((row, index) => {
    row.cells[0].textContent = index + 1;
  });
}

function addItem(weight = "", length = "") {
  const id = ++itemId;
  const row = document.createElement("tr");
  row.id = `item-row-${id}`;
  row.innerHTML = `
    <td></td>
    <td><input type="number" value="${weight}" id="iw-${id}"></td>
    <td><input type="number" step="0.1" value="${length}" id="il-${id}"></td>
    <td><button class="btn-del" type="button" data-remove-item="${id}">×</button></td>
  `;
  document.getElementById("item-body").appendChild(row);
  renumber("item-body");
}

function addVehicle(name = "", maxWeight = "", maxLength = "", minCharge = "", spacing = "", fleet = "") {
  const id = ++vehicleId;
  const row = document.createElement("tr");
  row.id = `vehicle-row-${id}`;
  row.innerHTML = `
    <td></td>
    <td><input type="text" value="${name}" id="vn-${id}"></td>
    <td><input type="number" value="${maxWeight}" id="vW-${id}"></td>
    <td><input type="number" value="${minCharge}" id="vw-${id}"></td>
    <td><input type="number" step="0.1" value="${maxLength}" id="vL-${id}"></td>
    <td><input type="number" step="0.1" value="${spacing}" id="vg-${id}"></td>
    <td><input type="number" value="${fleet}" id="vf-${id}"></td>
    <td><button class="btn-del" type="button" data-remove-vehicle="${id}">×</button></td>
  `;
  document.getElementById("vehicle-body").appendChild(row);
  renumber("vehicle-body");
}

function removeItem(id) {
  document.getElementById(`item-row-${id}`)?.remove();
  renumber("item-body");
}

function removeVehicle(id) {
  document.getElementById(`vehicle-row-${id}`)?.remove();
  renumber("vehicle-body");
}

function setObjective(nextObjective) {
  objective = nextObjective;
  document.querySelectorAll(".obj-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.objective === nextObjective);
  });
}

function readItems() {
  return Array.from(document.querySelectorAll("#item-body tr")).map((row, index) => {
    const id = row.id.split("-")[2];
    return {
      seq: index + 1,
      w: parseFloat(document.getElementById(`iw-${id}`).value) || 0,
      l: parseFloat(document.getElementById(`il-${id}`).value) || 0
    };
  });
}

function readVehicles() {
  return Array.from(document.querySelectorAll("#vehicle-body tr")).map((row, index) => {
    const id = row.id.split("-")[2];
    return {
      idx: index,
      name: document.getElementById(`vn-${id}`).value || `Classe_${index + 1}`,
      W: parseFloat(document.getElementById(`vW-${id}`).value) || 0,
      L: parseFloat(document.getElementById(`vL-${id}`).value) || 0,
      wmin: parseFloat(document.getElementById(`vw-${id}`).value) || 0,
      gap: parseFloat(document.getElementById(`vg-${id}`).value) || 0,
      fleet: parseInt(document.getElementById(`vf-${id}`).value, 10) || 0
    };
  });
}

function buildTrips(items, vehicles) {
  const tripsFrom = Array.from({ length: items.length }, () => []);

  for (let start = 0; start < items.length; start++) {
    let sumW = 0;
    let sumL = 0;

    for (let end = start; end < items.length; end++) {
      sumW += items[end].w;
      sumL += items[end].l;
      const nItems = end - start + 1;

      vehicles.forEach((vehicle, vehicleIdx) => {
        const occupiedLength = sumL + (nItems > 1 ? (nItems - 1) * vehicle.gap : 0);

        if (sumW <= vehicle.W && occupiedLength <= vehicle.L) {
          tripsFrom[start].push({
            end,
            vehicleIdx,
            totalW: sumW,
            totalL: occupiedLength,
            charged: Math.max(sumW, vehicle.wmin)
          });
        }
      });
    }
  }

  return tripsFrom;
}

function solve() {
  const items = readItems();
  const vehicles = readVehicles();
  const status = document.getElementById("status-msg");
  const results = document.getElementById("results");

  status.textContent = "processando estados...";

  if (!items.length || !vehicles.length) {
    results.className = "results visible";
    results.innerHTML = '<div class="error-box">Informe ao menos uma carga e uma classe de veiculo.</div>';
    status.textContent = "entrada incompleta";
    return;
  }

  const tripsFrom = buildTrips(items, vehicles);
  const best = new Map();
  const parent = new Map();
  const statesByPos = Array.from({ length: items.length + 1 }, () => []);
  const startKey = `0|${Array(vehicles.length).fill(0).join(",")}`;

  best.set(startKey, 0);
  statesByPos[0].push(startKey);

  for (let position = 0; position < items.length; position++) {
    for (const currentKey of statesByPos[position]) {
      const currentCost = best.get(currentKey);
      const usage = currentKey.split("|")[1].split(",").map(Number);

      for (const trip of tripsFrom[position]) {
        const vehicleIndex = trip.vehicleIdx;
        if (usage[vehicleIndex] >= vehicles[vehicleIndex].fleet) continue;

        const nextUsage = [...usage];
        nextUsage[vehicleIndex] += 1;

        const nextKey = `${trip.end + 1}|${nextUsage.join(",")}`;
        const increment = objective === "vehicles" ? 1 : trip.charged;

        if (!best.has(nextKey) || currentCost + increment < best.get(nextKey)) {
          if (!best.has(nextKey)) {
            statesByPos[trip.end + 1].push(nextKey);
          }

          best.set(nextKey, currentCost + increment);
          parent.set(nextKey, {
            prev: currentKey,
            start: position,
            end: trip.end,
            vIdx: vehicleIndex,
            w: trip.totalW,
            l: trip.totalL,
            c: trip.charged
          });
        }
      }
    }
  }

  let finalKey = null;
  let bestObjectiveValue = Infinity;

  statesByPos[items.length].forEach((key) => {
    if (best.get(key) < bestObjectiveValue) {
      bestObjectiveValue = best.get(key);
      finalKey = key;
    }
  });

  results.innerHTML = "";
  results.className = "results visible";

  if (!finalKey) {
    results.innerHTML = '<div class="error-box">Nenhuma solucao viavel para a configuracao informada.</div>';
    status.textContent = "sem solucao";
    return;
  }

  const trips = [];
  let current = finalKey;
  while (parent.has(current)) {
    const step = parent.get(current);
    trips.push(step);
    current = step.prev;
  }
  trips.reverse();

  renderResults(results, items, vehicles, trips, bestObjectiveValue);
  status.textContent = `${trips.length} viagens · ${best.size.toLocaleString("pt-BR")} estados explorados`;
}

function renderResults(results, items, vehicles, trips, objectiveValue) {
  let totalW = 0;
  let totalC = 0;

  const header = document.createElement("div");
  header.className = "results-header";
  header.innerHTML = `
    <div>
      <p class="eyebrow">Resultado</p>
      <h3>Alocacao reconstruida a partir do estado otimo</h3>
    </div>
    <div class="results-meta">
      objetivo = ${objective === "vehicles" ? "menos veiculos" : "menor custo"} · valor = ${objectiveValue.toLocaleString("pt-BR")}
    </div>
  `;
  results.appendChild(header);

  const table = document.createElement("table");
  table.className = "alloc-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Veiculo</th>
        <th>Cargas</th>
        <th class="num">Peso Real</th>
        <th class="num">Comprimento Ocupado</th>
        <th class="num">Peso Cobrado</th>
      </tr>
    </thead>
  `;

  const body = document.createElement("tbody");

  trips.forEach((trip, index) => {
    totalW += trip.w;
    totalC += trip.c;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td><span class="vehicle-badge vc-${trip.vIdx % 5}">${vehicles[trip.vIdx].name}</span></td>
      <td>${items.slice(trip.start, trip.end + 1).map((item) => `<span class="item-chip">${item.seq}</span>`).join("")}</td>
      <td class="num">${trip.w.toLocaleString("pt-BR")}</td>
      <td class="num">${trip.l.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
      <td class="num" style="color:${trip.c > trip.w ? "var(--danger)" : "inherit"}">${trip.c.toLocaleString("pt-BR")}</td>
    `;
    body.appendChild(row);
  });

  const totalRow = document.createElement("tr");
  totalRow.className = "total-row";
  totalRow.innerHTML = `
    <td></td>
    <td>Total</td>
    <td></td>
    <td class="num">${totalW.toLocaleString("pt-BR")}</td>
    <td></td>
    <td class="num">${totalC.toLocaleString("pt-BR")}</td>
  `;
  body.appendChild(totalRow);
  table.appendChild(body);
  results.appendChild(table);

  const viz = document.createElement("div");
  viz.className = "seq-viz";
  viz.innerHTML = "<h4>Visualizacao da sequencia particionada</h4>";

  const bar = document.createElement("div");
  bar.className = "seq-bar";

  trips.forEach((trip) => {
    const segment = document.createElement("div");
    segment.className = `seq-segment seg-${trip.vIdx % 5}`;
    segment.style.flex = trip.end - trip.start + 1;
    segment.textContent = vehicles[trip.vIdx].name;
    bar.appendChild(segment);
  });

  viz.appendChild(bar);
  results.appendChild(viz);
}

document.getElementById("add-item").addEventListener("click", () => addItem());
document.getElementById("add-vehicle").addEventListener("click", () => addVehicle());
document.getElementById("solve").addEventListener("click", solve);

document.querySelectorAll(".obj-btn").forEach((button) => {
  button.addEventListener("click", () => setObjective(button.dataset.objective));
});

document.body.addEventListener("click", (event) => {
  const removeItemId = event.target.dataset.removeItem;
  const removeVehicleId = event.target.dataset.removeVehicle;

  if (removeItemId) removeItem(removeItemId);
  if (removeVehicleId) removeVehicle(removeVehicleId);
});

seedItems.forEach((item) => addItem(item.w, item.l));
seedVehicles.forEach((vehicle) => addVehicle(vehicle.name, vehicle.W, vehicle.L, vehicle.wmin, vehicle.gap, vehicle.fleet));
