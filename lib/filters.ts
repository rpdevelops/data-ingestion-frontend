import { AppFront } from "@/types/app";

// Função para filtrar apps por status de contrato (mantida para compatibilidade)
export function filterAppsByContractStatus(apps: AppFront[], showActiveOnly: boolean): AppFront[] {
  if (!showActiveOnly) return apps;
  
  return apps.filter(app => app.app_stauscontrato === "Ativo");
}

// Função para filtrar dados do gráfico por período de tempo
export function filterChartDataByTimeRange(
  data: Array<Record<string, number | string | null>>, 
  timeRange: string,
  dataKey: string = "date"
): Array<Record<string, number | string | null>> {
  if (!data.length) return data;
  
  const timeRanges = [
    { value: "all", label: "Todos os dados", days: 365 * 10 }, // 10 anos
    { value: "365d", label: "Último ano", days: 365 },
    { value: "90d", label: "Últimos 3 Meses", days: 90 },
    { value: "30d", label: "Último mês", days: 30 },
  ];
  
  const range = timeRanges.find(r => r.value === timeRange);
  if (!range || range.value === "all") return data;
  
  // Descobre a data máxima do dataset
  const maxDate = new Date((data[data.length - 1][dataKey] ?? "") as string);
  
  // Calcula a data de início baseada no range selecionado
  const startDate = new Date(maxDate);
  startDate.setDate(startDate.getDate() - range.days);
  
  // Filtra os dados baseado no range de tempo
  return data.filter((item) => {
    const date = new Date((item[dataKey] ?? "") as string);
    return date >= startDate;
  });
}

// Função para calcular totais por plano baseado nos apps filtrados
export function calculateTotalsByPlan(apps: AppFront[]) {
  const PLANOS = [
    { id: 0, label: "Não informado" },
    { id: 1, label: "Básico" },
    { id: 2, label: "Premium" },
    { id: 3, label: "Full" }
  ];
  
  return PLANOS.map(plano => ({
    plano: plano.label,
    total: apps.filter(app => app.app_planoatual === plano.label).length
  }));
}
