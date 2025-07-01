
let data = [];
let filtros = {
  periodo: '',
  perspectiva: '',
  sucursal: '',
  oficial: ''
};

async function cargarDatos() {
  const response = await fetch('simulacion_kpis_banco_ejemplo.csv');
  const text = await response.text();
  const rows = text.split('\n').slice(1);
  data = rows.map(row => {
    const [Mes, Unidad, Sucursal, Perspectiva, Indicador, Valor, UnidadMedida] = row.split(',');
    return { Mes, Unidad, Sucursal, Perspectiva, Indicador, Valor: parseFloat(Valor), UnidadMedida };
  });
  inicializarFiltros();
  aplicarFiltros();
}

function inicializarFiltros() {
  const periodos = [...new Set(data.map(d => d.Mes))].sort();
  const sucursales = [...new Set(data.map(d => d.Sucursal))].filter(s => s !== "Casa Matriz").sort();
  const oficiales = [...new Set(data.map(d => d.Unidad))].filter(u => u !== "Procesamiento Comercial").sort();

  const filtroPeriodo = document.getElementById('filtroPeriodo');
  const filtroSucursal = document.getElementById('filtroSucursal');
  const filtroOficial = document.getElementById('filtroOficial');

  periodos.forEach(p => filtroPeriodo.innerHTML += `<option value="${p}">${p}</option>`);
  sucursales.forEach(s => filtroSucursal.innerHTML += `<option value="${s}">${s}</option>`);
  oficiales.forEach(o => filtroOficial.innerHTML += `<option value="${o}">${o}</option>`);

  filtroPeriodo.addEventListener('change', e => { filtros.periodo = e.target.value; aplicarFiltros(); });
  filtroSucursal.addEventListener('change', e => {
    filtros.sucursal = e.target.value;
    actualizarOficiales(filtros.sucursal);
    filtros.oficial = '';
    aplicarFiltros();
  });
  document.getElementById('filtroPerspectiva').addEventListener('change', e => {
    filtros.perspectiva = e.target.value;
    aplicarFiltros();
  });
  filtroOficial.addEventListener('change', e => { filtros.oficial = e.target.value; aplicarFiltros(); });
  document.getElementById('btnExportar').addEventListener('click', exportarCSV);
}

function actualizarOficiales(sucursalSeleccionada) {
  const filtroOficial = document.getElementById('filtroOficial');
  filtroOficial.innerHTML = '<option value="">Todos los oficiales</option>';
  const oficialesFiltrados = [...new Set(data.filter(d => d.Sucursal === sucursalSeleccionada).map(d => d.Unidad))];
  oficialesFiltrados.sort().forEach(o => {
    filtroOficial.innerHTML += `<option value="${o}">${o}</option>`;
  });
}

function aplicarFiltros() {
  let filtrados = data.filter(d =>
    (!filtros.periodo || d.Mes === filtros.periodo) &&
    (!filtros.perspectiva || d.Perspectiva === filtros.perspectiva) &&
    (!filtros.sucursal || d.Sucursal === filtros.sucursal) &&
    (!filtros.oficial || d.Unidad === filtros.oficial)
  );

  const tabla = document.getElementById('tabla-kpis');
  tabla.innerHTML = '';
  filtrados.forEach(d => {
    const color = d.Valor >= 85 ? '🟢' : d.Valor >= 70 ? '🟡' : '🔴';
    tabla.innerHTML += `<tr>
      <td class="border px-4 py-2">${d.Unidad}</td>
      <td class="border px-4 py-2">${d.Sucursal}</td>
      <td class="border px-4 py-2">${d.Indicador}</td>
      <td class="border px-4 py-2">${d.Perspectiva}</td>
      <td class="border px-4 py-2">${d.Valor}</td>
      <td class="border px-4 py-2">${d.UnidadMedida}</td>
      <td class="border px-4 py-2">${color}</td>
    </tr>`;
  });

  const eficiencia = promedio(filtrados.filter(d => d.Perspectiva === "Eficiencia"));
  const calidad = promedio(filtrados.filter(d => d.Perspectiva === "Calidad"));
  const experiencia = promedio(filtrados.filter(d => d.Perspectiva === "Experiencia"));
  document.getElementById('kpi-eficiencia').textContent = eficiencia ? eficiencia.toFixed(1) : '--';
  document.getElementById('kpi-calidad').textContent = calidad ? calidad.toFixed(1) : '--';
  document.getElementById('kpi-experiencia').textContent = experiencia ? experiencia.toFixed(1) : '--';

  const casa = data.filter(d => d.Sucursal === "Casa Matriz");
  document.getElementById("tabla-casa-matriz").innerHTML = '<table class="min-w-full text-sm"><thead><tr class="bg-blue-900 text-white"><th class="px-4 py-2">Indicador</th><th class="px-4 py-2">Perspectiva</th><th class="px-4 py-2">Valor</th><th class="px-4 py-2">Semáforo</th></tr></thead><tbody>' +
    casa.map(d => `<tr class="text-center"><td class="border px-4 py-2">${d.Indicador}</td><td class="border px-4 py-2">${d.Perspectiva}</td><td class="border px-4 py-2">${d.Valor}</td><td class="border px-4 py-2">${d.Valor >= 85 ? '🟢' : d.Valor >= 70 ? '🟡' : '🔴'}</td></tr>`).join('') +
    '</tbody></table>';
}

function promedio(arr) {
  if (!arr.length) return null;
  return arr.reduce((sum, d) => sum + d.Valor, 0) / arr.length;
}

function exportarCSV() {
  const header = "Unidad,Sucursal,Indicador,Perspectiva,Valor,Unidad de Medida\n";
  const filas = [...document.querySelectorAll('#tabla-kpis tr')].map(tr => {
    return [...tr.children].slice(0, 6).map(td => td.textContent).join(',');
  });
  const blob = new Blob([header + filas.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kpis_filtrados.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function mostrarVista(seccion) {
  document.getElementById('vistaSucursales').classList.toggle('hidden', seccion !== 'sucursales');
  document.getElementById('vistaCasaMatriz').classList.toggle('hidden', seccion !== 'casaMatriz');
}

document.addEventListener('DOMContentLoaded', cargarDatos);
