import {
  AlertTriangle,
  Archive,
  BarChart3,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  PackageCheck,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-vue-next'

export const stats = [
  { label: 'Pedidos Pendentes', value: 128, delta: '+12 desde ontem', tone: 'blue', icon: FileText },
  { label: 'Stock Critico', value: 23, delta: '-5 desde ontem', tone: 'orange', icon: PackageCheck },
  { label: 'Aprovacoes Pendentes', value: 45, delta: '+8 desde ontem', tone: 'purple', icon: ShieldCheck },
  { label: 'Distribuicoes Activas', value: 16, delta: '+3 desde ontem', tone: 'green', icon: Truck },
  { label: 'Entradas Hoje', value: 342, delta: '+18% desde ontem', tone: 'blue', icon: Archive },
  { label: 'Saidas Hoje', value: 287, delta: '+22% desde ontem', tone: 'red', icon: ClipboardList },
]

export const notifications = [
  { title: 'Novo pedido criado', body: 'Pedido #2459 foi criado no Bloco B', time: 'Ha 2 minutos', tone: 'orange', icon: AlertTriangle },
  { title: 'Aprovacao pendente', body: 'Pedido #2454 aguarda sua aprovacao', time: 'Ha 10 minutos', tone: 'blue', icon: ClipboardCheck },
  { title: 'Stock critico', body: 'O produto "Leite em Po" esta com stock critico', time: 'Ha 15 minutos', tone: 'red', icon: AlertTriangle },
  { title: 'Distribuicao concluida', body: 'Distribuicao #1022 foi concluida com sucesso', time: 'Ha 20 minutos', tone: 'green', icon: CheckCircle2 },
  { title: 'Documento actualizado', body: 'Documento #DOC-887 foi actualizado', time: 'Ha 30 minutos', tone: 'blue', icon: FileText },
]

export const activities = [
  ['10:28', 'Pedido #2458 aprovado', 'Joao Manuel', 'Bloco A', '192.168.1.15'],
  ['10:20', 'Distribuicao #1023 concluida', 'Maria Santos', 'Cozinha', '192.168.1.22'],
  ['10:15', 'Entrada de stock registada', 'Carlos Alberto', 'Armazem', '192.168.1.18'],
  ['10:10', 'Documento #DOC-889 actualizado', 'Ana Ferreira', 'Direccao', '192.168.1.12'],
  ['10:05', 'Pedido #2457 criado', 'Paulo Lima', 'Bloco C', '192.168.1.25'],
]

export const alerts = [
  ['Stock critico do produto "Sabao em Po"', 'Ha 10 minutos', 'orange'],
  ['Pedido #2450 esta atrasado', 'Ha 25 minutos', 'red'],
  ['Aprovacao pendente do pedido #2448', 'Ha 30 minutos', 'orange'],
  ['Distribuicao #1021 com atraso na entrega', 'Ha 1 hora', 'red'],
]

export const sectorSummary = [
  ['Bloco A', 18, 320, 3],
  ['Bloco B', 15, 280, 2],
  ['Bloco C', 20, 240, 4],
  ['Bloco D', 12, 210, 2],
  ['Oficinas', 10, 180, 1],
]

export const requests = [
  ['#2459', 'Bloco A', '15/05/2024', 'Alta', 'Pendente', 'Joao Manuel'],
  ['#2458', 'Cozinha', '15/05/2024', 'Media', 'Em analise', 'Maria Santos'],
  ['#2457', 'Bloco C', '14/05/2024', 'Alta', 'Aprovado', 'Paulo Lima'],
  ['#2456', 'Oficinas', '14/05/2024', 'Baixa', 'Em distribuicao', 'Carlos Alberto'],
  ['#2455', 'Saude', '14/05/2024', 'Media', 'Concluido', 'Ana Ferreira'],
]

export const stockRows = [
  ['P001', 'Sabao em Po', 'Limpeza', '15 kg', '50 kg', 'Critico', 'Central'],
  ['P002', 'Detergente Liquido', 'Limpeza', '80 un', '30 un', 'Normal', 'Central'],
  ['P003', 'Arroz', 'Alimentacao', '200 kg', '100 kg', 'Normal', 'Central'],
  ['P004', 'Feijao', 'Alimentacao', '150 kg', '80 kg', 'Normal', 'Central'],
  ['P005', 'Leite em Po', 'Alimentacao', '5 kg', '20 kg', 'Critico', 'Central'],
]

export const distributions = [
  ['#1023', 'Bloco A', 5, 50, '15/05 08:30', '15/05 10:20', 'Concluida'],
  ['#1022', 'Cozinha', 8, 120, '15/05 08:45', '15/05 09:50', 'Concluida'],
  ['#1021', 'Oficinas', 6, 80, '14/05 14:30', '-', 'Atrasada'],
  ['#1020', 'Bloco C', 4, 40, '14/05 10:10', '14/05 11:00', 'Concluida'],
]

export const documents = [
  ['DOC-889', 'Memorando', 'Administrativo', '15/05/2024', 'Aprovado'],
  ['DOC-888', 'Circular', 'Geral', '14/05/2024', 'Aprovado'],
  ['DOC-887', 'Relatorio', 'Relatorios', '14/05/2024', 'Em analise'],
  ['DOC-886', 'Requisicao', 'Pedidos', '13/05/2024', 'Aprovado'],
  ['DOC-885', 'Inventario', 'Stock', '13/05/2024', 'Concluido'],
]

export const users = [
  ['Joao Manuel', 'Administrador', 'Direccao', 'Activo', '15/05/2024 10:25'],
  ['Maria Santos', 'Gestor', 'Cozinha', 'Activo', '15/05/2024 09:50'],
  ['Carlos Alberto', 'Logistico', 'Armazem', 'Activo', '15/05/2024 09:15'],
  ['Paulo Lima', 'Solicitante', 'Bloco C', 'Activo', '15/05/2024 08:40'],
  ['Ana Ferreira', 'Auditor', 'Direccao', 'Activo', '15/05/2024 08:20'],
]

export const reportTiles = [
  { label: 'Pedidos', icon: ClipboardList, tone: 'orange' },
  { label: 'Aprovacoes', icon: ClipboardCheck, tone: 'green' },
  { label: 'Stock', icon: PackageCheck, tone: 'red' },
  { label: 'Entradas e Saidas', icon: BarChart3, tone: 'blue' },
  { label: 'Distribuicao', icon: Truck, tone: 'blue' },
  { label: 'Por Sector', icon: Users, tone: 'purple' },
  { label: 'Documentos', icon: FileText, tone: 'blue' },
  { label: 'Personalizado', icon: Bell, tone: 'cyan' },
]
