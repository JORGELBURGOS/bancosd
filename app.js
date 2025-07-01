
fetch('simulacion_kpis_banco_ejemplo.csv')
  .then(r => r.text())
  .then(text => {
    const rows = text.trim().split('\n').slice(1);
    const data = rows.map(r => {
      const [unidad, sucursal, perspectiva, indicador, valor, unidad_medida] = r.split(',');
      return {
        unidad, sucursal, perspectiva, indicador,
        valor: parseFloat(valor),
        unidad_medida
      };
    });

    const resumen = { Eficiencia: [], Calidad: [], Experiencia: [] };
    data.forEach(d => resumen[d.perspectiva].push(d.valor));

    const avg = p => (resumen[p].reduce((a,b) => a+b,0) / resumen[p].length).toFixed(1);
    document.getElementById("kpi-eficiencia").textContent = avg("Eficiencia");
    document.getElementById("kpi-calidad").textContent = avg("Calidad");
    document.getElementById("kpi-experiencia").textContent = avg("Experiencia");

    const radar = new Chart(document.getElementById("radarChart"), {
      type: "radar",
      data: {
        labels: ["Eficiencia", "Calidad", "Experiencia"],
        datasets: [{
          label: "Índice General",
          data: [avg("Eficiencia"), avg("Calidad"), avg("Experiencia")],
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 2
        }]
      },
      options: { scales: { r: { beginAtZero: true, max: 100 } } }
    });

    const top = data.sort((a,b) => b.valor - a.valor).slice(0, 10);
    new Chart(document.getElementById("barChart"), {
      type: "bar",
      data: {
        labels: top.map(t => t.indicador),
        datasets: [{
          label: "Valor",
          data: top.map(t => t.valor),
          backgroundColor: top.map(t => t.valor >= 80 ? 'green' : t.valor >= 60 ? 'orange' : 'red')
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Top 10 Indicadores" }
        }
      }
    });

    const body = document.getElementById("tabla-kpis");
    data.forEach(d => {
      const row = document.createElement("tr");
      const color = d.valor >= 80 ? "🟢" : d.valor >= 60 ? "🟠" : "🔴";
      row.innerHTML = `<td>${d.indicador}</td><td>${d.perspectiva}</td><td>${d.valor}</td><td>${d.unidad_medida}</td><td>${color}</td>`;
      body.appendChild(row);
    });
  });
