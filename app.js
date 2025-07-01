
let registros = [];

fetch('simulacion_kpis_banco_ejemplo.csv')
  .then(response => response.text())
  .then(data => {
    const rows = data.trim().split('\n').slice(1);
    registros = rows.map(row => {
      const [mes, unidad, sucursal, perspectiva, indicador, valor, unidad_medida] = row.split(',');
      return { mes, unidad, sucursal, perspectiva, indicador, valor: parseFloat(valor), unidad_medida };
    });

    inicializarFiltros();
    actualizarDashboard();
  });

function inicializarFiltros() {
  const unidades = [...new Set(registros.map(r => r.unidad))];
  const sucursales = [...new Set(registros.map(r => r.sucursal))];
  const meses = [...new Set(registros.map(r => r.mes))].sort();

  const unidadSelect = document.getElementById("filtroUnidad");
  unidades.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = u;
    unidadSelect.appendChild(opt);
  });

  const sucursalSelect = document.getElementById("filtroSucursal");
  sucursales.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    sucursalSelect.appendChild(opt);
  });

  const periodoSelect = document.getElementById("filtroPeriodo");
  meses.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    periodoSelect.appendChild(opt);
  });

  unidadSelect.onchange = actualizarDashboard;
  sucursalSelect.onchange = actualizarDashboard;
  document.getElementById("filtroPerspectiva").onchange = actualizarDashboard;
  periodoSelect.onchange = actualizarDashboard;
  document.getElementById("btnExportar").onclick = exportarTabla;
}

function actualizarDashboard() {
  const unidad = document.getElementById("filtroUnidad").value;
  const sucursal = document.getElementById("filtroSucursal").value;
  const perspectiva = document.getElementById("filtroPerspectiva").value;
  const periodo = document.getElementById("filtroPeriodo").value;

  const filtrados = registros.filter(r =>
    (!unidad || r.unidad === unidad) &&
    (!sucursal || r.sucursal === sucursal) &&
    (!perspectiva || r.perspectiva === perspectiva) &&
    (!periodo || r.mes === periodo)
  );

  const resumen = { Eficiencia: [], Calidad: [], Experiencia: [] };
  filtrados.forEach(f => resumen[f.perspectiva].push(f.valor));
  document.getElementById("kpi-eficiencia").textContent = resumen.Eficiencia.length ? promedio(resumen.Eficiencia) : "--";
  document.getElementById("kpi-calidad").textContent = resumen.Calidad.length ? promedio(resumen.Calidad) : "--";
  document.getElementById("kpi-experiencia").textContent = resumen.Experiencia.length ? promedio(resumen.Experiencia) : "--";

  actualizarTabla(filtrados);
}

function actualizarTabla(datos) {
  const tbody = document.getElementById("tabla-kpis");
  tbody.innerHTML = "";

  const agrupados = {};
  datos.forEach(d => {
    if (!agrupados[d.perspectiva]) agrupados[d.perspectiva] = [];
    agrupados[d.perspectiva].push(d);
  });

  Object.keys(agrupados).forEach(persp => {
    const head = document.createElement("tr");
    head.innerHTML = `<td colspan="7" class="bg-gray-200 text-left font-bold px-4 py-2">${persp}</td>`;
    tbody.appendChild(head);

    agrupados[persp].forEach(d => {
      const row = document.createElement("tr");
      const semaforo = d.valor >= 80 ? "🟢" : d.valor >= 60 ? "🟠" : "🔴";
      row.innerHTML = `
        <td>${d.unidad}</td>
        <td>${d.sucursal}</td>
        <td>${d.indicador}</td>
        <td>${d.perspectiva}</td>
        <td>${d.valor}</td>
        <td>${d.unidad_medida}</td>
        <td>${semaforo}</td>
      `;
      tbody.appendChild(row);
    });
  });
}

function promedio(arr) {
  return (arr.reduce((a,b) => a+b,0)/arr.length).toFixed(1);
}

function exportarTabla() {
  const rows = [...document.querySelectorAll("#tabla-kpis tr")];
  const csv = [["Unidad", "Sucursal", "Indicador", "Perspectiva", "Valor", "Unidad de Medida", "Semáforo"]];
  rows.forEach(row => {
    const cols = row.querySelectorAll("td");
    if (cols.length === 7) {
      csv.push([...cols].map(td => td.textContent));
    }
  });
  const csvContent = "data:text/csv;charset=utf-8," + csv.map(e => e.join(",")).join("\n");
  const a = document.createElement("a");
  a.href = csvContent;
  a.download = "tabla_kpis_filtrada.csv";
  a.click();
}
