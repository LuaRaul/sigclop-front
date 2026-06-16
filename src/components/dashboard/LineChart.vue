<template>
  <article class="dash-card chart-card">
    <div class="card-title">
      <strong>Movimentacao de Stock</strong>
      <span>Ultimos 6 meses</span>
    </div>
    <div class="chart-legend">
      <span><i class="line-green"></i>Entradas</span>
      <span><i class="line-red"></i>Saidas</span>
    </div>
    <svg class="line-chart" viewBox="0 0 520 230" role="img" aria-label="Movimentacao de stock">
      <g class="grid-lines">
        <line x1="20" y1="40" x2="500" y2="40" />
        <line x1="20" y1="85" x2="500" y2="85" />
        <line x1="20" y1="130" x2="500" y2="130" />
        <line x1="20" y1="175" x2="500" y2="175" />
      </g>
      <polyline class="area-green" points="28,135 98,112 170,148 240,104 312,142 382,62 452,113 500,82" />
      <polyline class="area-red" points="28,178 98,135 170,160 240,124 312,157 382,113 452,148 500,123" />
      <polyline class="stroke-green" points="28,135 98,112 170,148 240,104 312,142 382,62 452,113 500,82" />
      <polyline class="stroke-red" points="28,178 98,135 170,160 240,124 312,157 382,113 452,148 500,123" />
      <g class="months">
        <text x="28" y="220">Dez</text><text x="98" y="220">Jan</text><text x="170" y="220">Fev</text>
        <text x="240" y="220">Mar</text><text x="312" y="220">Abr</text><text x="382" y="220">Mai</text>
      </g>
    </svg>
  </article>
</template>
