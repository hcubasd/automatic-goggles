let objective = "cost";
let itemId = 0;
let vehicleId = 0;
const SUPABASE_URL = "https://lbzpelfsuadhrmyhjzgh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fctgVRED2YyUZOSUCNT25A_C26zFdKf";
const APP_VERSION = "github-pages-direct-write";

const seedItems = [
  { w: 10000, l: 1.5 },
  { w: 12000, l: 1.8 },
  { w: 8000, l: 1.4 },
  { w: 15000, l: 2.2 },
  { w: 9000, l: 1.6 }
];

const seedVehicles = [
  { name: "Classe_A", maxUnits: 1, W: 15000, L: 5.0, wmin: 10000, gap: 0.2, fleet: 10 },
  { name: "Classe_B", maxUnits: 3, W: 35000, L: 14.0, wmin: 25000, gap: 0.5, fleet: 2 }
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

function addVehicle(name = "", maxUnits = "", maxWeight = "", maxLength = "", minCharge = "", spacing = "", fleet = "") {
  const id = ++vehicleId;
  const row = document.createElement("tr");
  row.id = `vehicle-row-${id}`;
  row.innerHTML = `
    <td></td>
    <td><input type="text" value="${name}" id="vn-${id}"></td>
    <td><input type="number" min="1" step="1" value="${maxUnits}" id="vu-${id}"></td>
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
      maxUnits: parseInt(document.getElementById(`vu-${id}`).value, 10) || 0,
      W: parseFloat(document.getElementById(`vW-${id}`).value) || 0,
      L: parseFloat(document.getElementById(`vL-${id}`).value) || 0,
      wmin: parseFloat(document.getElementById(`vw-${id}`).value) || 0,
      gap: parseFloat(document.getElementById(`vg-${id}`).value) || 0,
      fleet: parseInt(document.getElementById(`vf-${id}`).value, 10) || 0
    };
  });
}

function hasNegative(values) {
  return values.some((value) => value < 0);
}

function hasAnyPositive(values) {
  return values.some((value) => value > 0);
}

function hasAllPositive(values) {
  return values.every((value) => value > 0);
}

function analyzeProblem(items, vehicles) {
  if (!items.length || !vehicles.length) {
    return {
      valid: false,
      message: "Informe ao menos uma carga e uma classe de veículo."
    };
  }

  const itemWeights = items.map((item) => item.w);
  const itemLengths = items.map((item) => item.l);
  const vehicleUnits = vehicles.map((vehicle) => vehicle.maxUnits);
  const vehicleWeights = vehicles.map((vehicle) => vehicle.W);
  const vehicleMinCharges = vehicles.map((vehicle) => vehicle.wmin);
  const vehicleLengths = vehicles.map((vehicle) => vehicle.L);
  const vehicleGaps = vehicles.map((vehicle) => vehicle.gap);
  const vehicleFleet = vehicles.map((vehicle) => vehicle.fleet);

  if (
    hasNegative(itemWeights) ||
    hasNegative(itemLengths) ||
    hasNegative(vehicleUnits) ||
    hasNegative(vehicleWeights) ||
    hasNegative(vehicleMinCharges) ||
    hasNegative(vehicleLengths) ||
    hasNegative(vehicleGaps) ||
    hasNegative(vehicleFleet)
  ) {
    return {
      valid: false,
      message: "Use apenas valores maiores ou iguais a zero."
    };
  }

  const itemLengthAny = hasAnyPositive(itemLengths);
  const itemWeightAll = hasAllPositive(itemWeights);
  const itemLengthAll = hasAllPositive(itemLengths);
  const vehicleWeightAny = hasAnyPositive(vehicleWeights);
  const vehicleLengthAny = hasAnyPositive(vehicleLengths);

  if (!itemWeightAll) {
    return {
      valid: false,
      message: "Informe pesos não nulos para todas as cargas."
    };
  }

  if (itemLengthAny && !itemLengthAll) {
    return {
      valid: false,
      message: "Se informar um comprimento, informe comprimentos não nulos para todas as cargas."
    };
  }

  if (!vehicleWeightAny) {
    return {
      valid: false,
      message: "Informe ao menos um Peso Máx. não nulo na frota."
    };
  }

  const useWeight = true;
  const useLength = itemLengthAll && vehicleLengthAny;

  return {
    valid: true,
    message: "pronto para calcular",
    config: {
      useWeight,
      useLength,
      useUnits: hasAnyPositive(vehicleUnits),
      useMinCharge: hasAnyPositive(vehicleMinCharges),
      useFleet: hasAnyPositive(vehicleFleet)
    }
  };
}

function buildTrips(items, vehicles, config) {
  const tripsFrom = Array.from({ length: items.length }, () => []);

  for (let start = 0; start < items.length; start++) {
    let sumW = 0;
    let sumL = 0;

    for (let end = start; end < items.length; end++) {
      sumW += items[end].w;
      sumL += items[end].l;
      const nItems = end - start + 1;

      vehicles.forEach((vehicle, vehicleIdx) => {
        const occupiedLength = config.useLength
          ? sumL + (nItems > 1 ? (nItems - 1) * vehicle.gap : 0)
          : 0;
        const unitsOk = !config.useUnits || nItems <= vehicle.maxUnits;
        const weightOk = !config.useWeight || sumW <= vehicle.W;
        const lengthOk = !config.useLength || occupiedLength <= vehicle.L;
        const charged = config.useMinCharge
          ? Math.max(config.useWeight ? sumW : 0, vehicle.wmin)
          : (config.useWeight ? sumW : 0);

        if (unitsOk && weightOk && lengthOk) {
          tripsFrom[start].push({
            end,
            vehicleIdx,
            totalW: config.useWeight ? sumW : 0,
            totalL: occupiedLength,
            totalUnits: nItems,
            charged
          });
        }
      });
    }
  }

  return tripsFrom;
}

async function logOptimizationRun(payload) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/optimization_runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Falha ao registrar execução no Supabase:", errorText);
    }
  } catch (error) {
    console.error("Erro de rede ao registrar execução no Supabase:", error);
  }
}

function createRunPayload(items, vehicles, config, status, extras = {}) {
  const resultTrips = extras.resultTrips ?? null;
  const totalRealWeight = resultTrips
    ? resultTrips.reduce((sum, trip) => sum + trip.w, 0)
    : null;
  const totalChargedWeight = resultTrips
    ? resultTrips.reduce((sum, trip) => sum + trip.c, 0)
    : null;

  return {
    objective,
    status,
    has_solution: status === "success",
    num_items: items.length,
    num_vehicle_classes: vehicles.length,
    num_trips: resultTrips ? resultTrips.length : null,
    weight_active: config.useWeight,
    length_active: config.useLength,
    units_active: config.useUnits,
    min_charge_active: config.useMinCharge,
    fleet_active: config.useFleet,
    total_real_weight: totalRealWeight,
    total_charged_weight: totalChargedWeight,
    input_items: items,
    input_vehicles: vehicles,
    effective_config: config,
    result_trips: resultTrips,
    objective_value: extras.objectiveValue ?? null,
    states_explored: extras.statesExplored ?? null,
    app_version: APP_VERSION
  };
}

function solve() {
  const items = readItems();
  const vehicles = readVehicles();
  const status = document.getElementById("status-msg");
  const results = document.getElementById("results");
  const analysis = analyzeProblem(items, vehicles);

  if (!analysis.valid) {
    results.className = "results visible";
    results.innerHTML = `<div class="error-box">${analysis.message}</div>`;
    status.textContent = "entrada inválida";
    return;
  }

  status.textContent = "processando estados...";

  const tripsFrom = buildTrips(items, vehicles, analysis.config);
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
        if (analysis.config.useFleet && usage[vehicleIndex] >= vehicles[vehicleIndex].fleet) continue;

        const nextUsage = analysis.config.useFleet ? [...usage] : usage;
        if (analysis.config.useFleet) {
          nextUsage[vehicleIndex] += 1;
        }

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
            units: trip.totalUnits,
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
    results.innerHTML = '<div class="error-box">Nenhuma solução viável para a configuração informada.</div>';
    status.textContent = "sem solução";
    void logOptimizationRun(
      createRunPayload(items, vehicles, analysis.config, "infeasible", {
        statesExplored: best.size
      })
    );
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

  renderResults(results, items, vehicles, trips, bestObjectiveValue, analysis.config);
  status.textContent = `${trips.length} viagens · ${best.size.toLocaleString("pt-BR")} estados explorados`;
  void logOptimizationRun(
    createRunPayload(items, vehicles, analysis.config, "success", {
      resultTrips: trips,
      objectiveValue: bestObjectiveValue,
      statesExplored: best.size
    })
  );
}

function renderResults(results, items, vehicles, trips, objectiveValue, config) {
  let totalW = 0;
  let totalC = 0;

  const header = document.createElement("div");
  header.className = "results-header";
  header.innerHTML = `
    <div>
      <p class="eyebrow">Resultado</p>
      <h3>Alocação reconstruída a partir do estado ótimo</h3>
    </div>
    <div class="results-meta">
      objetivo = ${objective === "vehicles" ? "menos veículos" : "menor custo"} · valor = ${objectiveValue.toLocaleString("pt-BR")}
    </div>
  `;
  results.appendChild(header);

  const table = document.createElement("table");
  table.className = "alloc-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Veículo</th>
        <th>Cargas</th>
        <th class="num">Unidades</th>
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
      <td><span class="vehicle-badge vc-${trip.vIdx % 6}">${vehicles[trip.vIdx].name}</span></td>
      <td>${items.slice(trip.start, trip.end + 1).map((item) => `<span class="item-chip">${item.seq}</span>`).join("")}</td>
      <td class="num">${trip.units}</td>
      <td class="num">${config.useWeight ? trip.w.toLocaleString("pt-BR") : "—"}</td>
      <td class="num">${config.useLength ? trip.l.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "—"}</td>
      <td class="num" style="color:${trip.c > trip.w ? "var(--red)" : "var(--peach)"}">${trip.c.toLocaleString("pt-BR")}</td>
    `;
    body.appendChild(row);
  });

  const totalRow = document.createElement("tr");
  totalRow.className = "total-row";
  totalRow.innerHTML = `
    <td></td>
    <td>Total</td>
    <td></td>
    <td></td>
    <td class="num">${config.useWeight ? totalW.toLocaleString("pt-BR") : "—"}</td>
    <td></td>
    <td class="num">${totalC.toLocaleString("pt-BR")}</td>
  `;
  body.appendChild(totalRow);
  table.appendChild(body);
  results.appendChild(table);

  const viz = document.createElement("div");
  viz.className = "seq-viz";
  viz.innerHTML = "<h4>Visualização da sequência particionada</h4>";

  const bar = document.createElement("div");
  bar.className = "seq-bar";

  trips.forEach((trip) => {
    const segment = document.createElement("div");
    segment.className = `seq-segment seg-${trip.vIdx % 6}`;
    segment.style.flex = trip.end - trip.start + 1;
    segment.textContent = vehicles[trip.vIdx].name;
    bar.appendChild(segment);
  });

  viz.appendChild(bar);
  results.appendChild(viz);
}

function updateSolveAvailability() {
  const items = readItems();
  const vehicles = readVehicles();
  const solveButton = document.getElementById("solve");
  const status = document.getElementById("status-msg");
  const analysis = analyzeProblem(items, vehicles);
  const itemLengths = items.map((item) => item.l);
  const vehicleUnits = vehicles.map((vehicle) => vehicle.maxUnits);
  const vehicleMinCharges = vehicles.map((vehicle) => vehicle.wmin);
  const vehicleLengths = vehicles.map((vehicle) => vehicle.L);
  const vehicleGaps = vehicles.map((vehicle) => vehicle.gap);
  const vehicleFleet = vehicles.map((vehicle) => vehicle.fleet);

  solveButton.disabled = !analysis.valid;
  status.textContent = analysis.message;

  document.getElementById("item-weight-header")?.classList.remove("inactive-col");
  document.getElementById("vehicle-weight-header")?.classList.remove("inactive-col");

  document.getElementById("item-length-header")?.classList.toggle("inactive-col", !hasAnyPositive(itemLengths));
  document.getElementById("vehicle-length-header")?.classList.toggle("inactive-col", !hasAnyPositive(vehicleLengths));
  document.getElementById("vehicle-units-header")?.classList.toggle("inactive-col", !hasAnyPositive(vehicleUnits));
  document.getElementById("vehicle-min-charge-header")?.classList.toggle("inactive-col", !hasAnyPositive(vehicleMinCharges));
  document.getElementById("vehicle-fleet-header")?.classList.toggle("inactive-col", !hasAnyPositive(vehicleFleet));

  const lengthsIgnored = !hasAnyPositive(itemLengths) || !hasAnyPositive(vehicleLengths);
  document.getElementById("vehicle-gap-header")?.classList.toggle("inactive-col", lengthsIgnored || !hasAnyPositive(vehicleGaps));
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
  updateSolveAvailability();
});

document.body.addEventListener("input", (event) => {
  if (event.target.matches("input")) {
    updateSolveAvailability();
  }
});

seedItems.forEach((item) => addItem(item.w, item.l));
seedVehicles.forEach((vehicle) => addVehicle(vehicle.name, vehicle.maxUnits, vehicle.W, vehicle.L, vehicle.wmin, vehicle.gap, vehicle.fleet));
updateSolveAvailability();
