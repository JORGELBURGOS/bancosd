
fetch('simulacion_kpis_banco_ejemplo.csv')
  .then(response => response.text())
  .then(data => {
    const rows = data.split('\n').slice(1);
    const registros = rows.map(row => {
      const cols = row.split(',');
      return {
        unidad: cols[0],
        sucursal: cols[1],
        perspectiva: cols[2],
        indicador: cols[3],
        valor: parseFloat(cols[4]),
        unidad_medida: cols[5]
      };
    });

    const unidades = [...new Set(registros.map(r => r.unidad))];
    const sucursales = [...new Set(registros.map(r => r.sucursal))];

    const unidadSelect = document.getElementById('unidad');
    unidades.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u;
      opt.textContent = u;
      unidadSelect.appendChild(opt);
    });

    const buscarSucursal = document.getElementById('buscarSucursal');

    buscarSucursal.addEventListener('input', () => updateDashboard());

    unidadSelect.addEventListener('change', updateDashboard);

    const radarCtx = document.getElementById('radarChart').getContext('2d');
    const barCtx = document.getElementById('barChart').getContext('2d');
    let radarChart, barChart;

    function updateDashboard() {
      const textoBusqueda = buscarSucursal.value.toLowerCase();
      const selectedUnidad = unidadSelect.value;

      const filtrados = registros.filter(r =>
        (!selectedUnidad || r.unidad === selectedUnidad) &&
        (!textoBusqueda || r.sucursal.toLowerCase().includes(textoBusqueda))
      );

      const tbody = document.querySelector('#tabla-kpis tbody');
      tbody.innerHTML = '';
      filtrados.forEach(r => {
        const tr = document.createElement('tr');
        const semaforo = r.valor >= 80 ? '🟢' : r.valor >= 60 ? '🟠' : '🔴';
        tr.innerHTML = `<td>${r.indicador}</td><td>${r.perspectiva}</td><td>${r.valor}</td><td>${r.unidad_medida}</td><td>${semaforo}</td>`;
        tbody.appendChild(tr);
      });

      const agrupados = filtrados.reduce((acc, r) => {
        acc[r.perspectiva] = acc[r.perspectiva] || [];
        acc[r.perspectiva].push(r.valor);
        return acc;
      }, {});

      const labels = Object.keys(agrupados);
      const valores = labels.map(l => {
        const vals = agrupados[l];
        return vals.reduce((a, b) => a + b, 0) / vals.length;
      });

      if (radarChart) radarChart.destroy();
      radarChart = new Chart(radarCtx, {
        type: 'radar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Índice Promedio',
            data: valores,
            fill: true,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgb(75, 192, 192)',
            pointBackgroundColor: 'rgb(75, 192, 192)'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Radar de Desempeño por Perspectiva' }
          }
        }
      });

      if (barChart) barChart.destroy();
      barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: filtrados.map(f => f.indicador),
          datasets: [{
            label: 'Valor del Indicador',
            data: filtrados.map(f => f.valor),
            backgroundColor: filtrados.map(f => f.valor >= 80 ? 'green' : f.valor >= 60 ? 'orange' : 'red')
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'Indicadores con Semaforización' }
          }
        }
      });
    }

    updateDashboard();
  });
