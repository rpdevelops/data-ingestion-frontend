"use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconDownload,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconSearch,
  IconX,
  IconFilter,
  IconFilterOff,
} from "@tabler/icons-react"
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  VisibilityState,
  ColumnFiltersState,
  Row,
  flexRender,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { IconExternalLink } from "@tabler/icons-react"

// Função para detectar se um valor é um link
function isLink(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  
  // Verifica se contém protocolos comuns
  const linkPatterns = [
    /^https?:\/\//i,
    /^http:\/\//i,
    /^ftp:\/\//i,
    /^mailto:/i,
    // /^tel:/i,
    /^www\./i
    // /\.com$/i,
    // /\.org$/i,
    // /\.net$/i,
    // /\.br$/i,
    // /\.io$/i,
    // /\.app$/i,
    // /\.dev$/i
  ];
  
  return linkPatterns.some(pattern => pattern.test(value));
}

// Funções de ordenação customizadas
const customSortingFns = {
  // Ordenação para datas no formato brasileiro (DD/MM/YYYY)
  dateBR: (rowA: { getValue: (columnId: string) => unknown }, rowB: { getValue: (columnId: string) => unknown }, columnId: string) => {
    const a = rowA.getValue(columnId);
    const b = rowB.getValue(columnId);
    
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    
    try {
      let dateA: Date;
      let dateB: Date;
      
      // Verificar se é formato brasileiro DD/MM/YYYY
      if (typeof a === 'string' && a.includes('/')) {
        const [dayA, monthA, yearA] = a.split('/');
        dateA = new Date(parseInt(yearA), parseInt(monthA) - 1, parseInt(dayA));
      } else {
        dateA = new Date(String(a));
      }
      
      if (typeof b === 'string' && b.includes('/')) {
        const [dayB, monthB, yearB] = b.split('/');
        dateB = new Date(parseInt(yearB), parseInt(monthB) - 1, parseInt(dayB));
      } else {
        dateB = new Date(String(b));
      }
      
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return -1;
      if (isNaN(dateB.getTime())) return 1;
      
      return dateA.getTime() - dateB.getTime();
    } catch {
      return 0;
    }
  },
  
  // Ordenação para números (incluindo strings numéricas)
  numeric: (rowA: { getValue: (columnId: string) => unknown }, rowB: { getValue: (columnId: string) => unknown }, columnId: string) => {
    const a = rowA.getValue(columnId);
    const b = rowB.getValue(columnId);
    
    if (a === null || a === undefined) return -1;
    if (b === null || b === undefined) return 1;
    
    const numA = typeof a === 'number' ? a : parseFloat(String(a).replace(/[^\d.-]/g, ''));
    const numB = typeof b === 'number' ? b : parseFloat(String(b).replace(/[^\d.-]/g, ''));
    
    if (isNaN(numA) && isNaN(numB)) return 0;
    if (isNaN(numA)) return -1;
    if (isNaN(numB)) return 1;
    
    return numA - numB;
  },
  
  // Ordenação para texto (case-insensitive)
  text: (rowA: { getValue: (columnId: string) => unknown }, rowB: { getValue: (columnId: string) => unknown }, columnId: string) => {
    const a = rowA.getValue(columnId);
    const b = rowB.getValue(columnId);
    
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    
    return String(a).toLowerCase().localeCompare(String(b).toLowerCase(), 'pt-BR');
  }
};

// Função para detectar o tipo de dados de uma coluna
function detectColumnType(columnId: string, sampleData: unknown[]): 'date' | 'numeric' | 'text' {
  // Verificar se é uma coluna de data baseada no nome
  const dateKeywords = ['data', 'date', 'created', 'updated', 'vencimento', 'cadastro', 'aquisicao', 'publicacao'];
  if (dateKeywords.some(keyword => columnId.toLowerCase().includes(keyword))) {
    return 'date';
  }
  
  // Verificar se é uma coluna numérica baseada no nome
  const numericKeywords = ['id', 'valor', 'preco', 'quantidade', 'count', 'total', 'numero'];
  if (numericKeywords.some(keyword => columnId.toLowerCase().includes(keyword))) {
    return 'numeric';
  }
  
  // Analisar dados de exemplo para determinar o tipo
  const sampleValues = sampleData.slice(0, 10).map(row => {
    if (typeof row === 'object' && row !== null && columnId in row) {
      return (row as Record<string, unknown>)[columnId];
    }
    return null;
  }).filter(val => val !== null && val !== undefined);
  
  if (sampleValues.length === 0) return 'text';
  
  // Verificar se são datas
  const datePattern = /^\d{2}\/\d{2}\/\d{4}$/; // DD/MM/YYYY
  const isDate = sampleValues.every(val => 
    typeof val === 'string' && datePattern.test(val)
  );
  if (isDate) return 'date';
  
  // Verificar se são números
  const isNumeric = sampleValues.every(val => 
    typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)))
  );
  if (isNumeric) return 'numeric';
  
  return 'text';
}

// Função para gerar opções de filtro dinamicamente baseadas nos dados
function generateFilterOptions(data: unknown[], field: string): { value: string; label: string }[] {
  const values = data
    .map(row => {
      if (typeof row === 'object' && row !== null && field in row) {
        return (row as Record<string, unknown>)[field];
      }
      return null;
    })
    .filter(val => val !== null && val !== undefined && val !== '')
    .map(val => String(val))
    .filter((val, index, arr) => arr.indexOf(val) === index) // Remove duplicatas
    .sort();
  
  // Adicionar opção "Selecionar" no início para desativar o filtro
  return [
    { value: '__SELECT_ALL__', label: 'Selecionar' },
    ...values.map(value => ({
      value,
      label: value
    }))
  ];
}

// Componente para renderizar botão de link
function LinkButton({ url }: { url: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Previne o clique na linha
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="h-8 w-8 p-0"
      title={`Abrir link: ${url}`}
    >
      <IconExternalLink className="h-4 w-4" />
    </Button>
  );
}

// Componente para header com ordenação
function SortableHeader({ 
  column, 
  children 
}: { 
  column: { getCanSort: () => boolean; toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" }; 
  children: React.ReactNode; 
}) {
  const canSort = column.getCanSort();
  
  if (!canSort) {
    return <span>{children}</span>;
  }

  const handleSort = () => {
    column.toggleSorting(column.getIsSorted() === "asc");
  };

  const getSortIcon = () => {
    const sortDirection = column.getIsSorted();
    if (sortDirection === "asc") {
      return <IconArrowUp className="h-4 w-4" />;
    } else if (sortDirection === "desc") {
      return <IconArrowDown className="h-4 w-4" />;
    }
    return <IconArrowsSort className="h-4 w-4 opacity-50" />;
  };

  return (
    <Button
      variant="ghost"
      onClick={handleSort}
      className="h-auto p-0 font-semibold hover:bg-transparent"
    >
      <div className="flex items-center gap-2">
        {children}
        {getSortIcon()}
      </div>
    </Button>
  );
}

function DraggableRow<TData>({ 
  row, 
  rowClickUrl 
}: { 
  row: Row<TData>;
  rowClickUrl?: string;
}) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.id,
  });
  const router = useRouter();

  const handleRowClick = () => {
    if (!rowClickUrl) return;
    
    // Busca dinamicamente o campo que contém 'id' no nome
    const rowData = row.original as Record<string, unknown>;
    const idField = Object.keys(rowData).find(key => 
      key.toLowerCase().includes('id') && 
      (rowData[key] !== null && rowData[key] !== undefined)
    );
    
    if (idField && rowData[idField]) {
      router.push(`${rowClickUrl}/${rowData[idField]}`);
    }
  };

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
      className={rowClickUrl ? "cursor-pointer hover:bg-muted/50" : ""}
      onClick={handleRowClick}
    >
      {row.getVisibleCells().map((cell) => {
        const cellValue = cell.getValue();
        
        return (
          <TableCell key={cell.id} className="text-center">
            {isLink(cellValue) ? (
              <LinkButton url={cellValue as string} />
            ) : (
              flexRender(cell.column.columnDef.cell, cell.getContext())
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

export interface FilterConfig {
  field: string;
  type: 'select' | 'text' | 'date' | 'daterange';
  label: string;
  options?: { value: string; label: string }[]; // Para tipo 'select' - opções fixas
  dynamicOptions?: boolean; // Se true, gera opções dinamicamente dos dados
  placeholder?: string; // Para tipo 'text'
  dateRangeFields?: { start: string; end: string }; // Para tipo 'daterange' - campos de data início e fim
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  initialVisibleColumns?: string[];
  rowClickUrl?: string; // URL base para redirecionamento ao clicar na linha
  searchFields?: string[]; // Campos para pesquisa global
  searchPlaceholder?: string; // Placeholder personalizado para a barra de pesquisa
  filters?: FilterConfig[]; // Configuração dos filtros avançados
}

export function DataTable<TData>({ 
  columns, 
  data, 
  initialVisibleColumns,
  rowClickUrl,
  searchFields = [],
  searchPlaceholder = "Pesquisar...",
  filters = []
}: DataTableProps<TData>) {
  const [tableData, setTableData] = React.useState(data);
  
  // Update tableData when data prop changes (for polling/real-time updates)
  React.useEffect(() => {
    // Always update when data prop changes (React will handle re-renders efficiently)
    setTableData(data);
  }, [data]);
  
  const dataIds = tableData.map((item, idx) =>
    typeof item === "object" && item !== null && "id" in item ? (item as { id: string | number }).id : idx
  );
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor)
  );

  // Aplicar funções de ordenação customizadas às colunas
  const enhancedColumns = React.useMemo(() => {
    return columns.map(column => {
      // Verificar se a coluna tem accessorKey
      const accessorKey = 'accessorKey' in column ? column.accessorKey : undefined;
      if (!accessorKey) return column;
      
      const columnType = detectColumnType(String(accessorKey), data);
      let sortingFn;
      
      switch (columnType) {
        case 'date':
          sortingFn = customSortingFns.dateBR;
          break;
        case 'numeric':
          sortingFn = customSortingFns.numeric;
          break;
        case 'text':
        default:
          sortingFn = customSortingFns.text;
          break;
      }
      
      return {
        ...column,
        sortingFn
      };
    });
  }, [columns, data]);

  // Inicializa columnVisibility com base em initialVisibleColumns
  const initialColumnVisibility: VisibilityState = React.useMemo(() => {
    if (!initialVisibleColumns) return {};
    const visibility: VisibilityState = {};
    columns.forEach(col => {
      // O id da coluna pode ser definido explicitamente ou ser igual ao accessorKey
      let id: string | undefined = undefined;
      if (typeof col.id === "string") {
        id = col.id;
      } else if ("accessorKey" in col && typeof (col as { accessorKey?: string }).accessorKey === "string") {
        id = (col as { accessorKey: string }).accessorKey;
      }
      if (id) {
        visibility[id] = initialVisibleColumns.includes(id);
      }
    });
    return visibility;
  }, [columns, initialVisibleColumns]);

  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialColumnVisibility);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  // Estado para filtros customizados - inicializar com valor padrão "Selecionar" apenas para selects
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>(() => {
    const initialValues: Record<string, string> = {};
    filters.forEach(filter => {
      // Apenas filtros do tipo 'select' recebem o valor padrão '__SELECT_ALL__'
      if (filter.type === 'select') {
        initialValues[filter.field] = '__SELECT_ALL__';
      } else if (filter.type === 'daterange' && filter.dateRangeFields) {
        // Para daterange, inicializar ambos os campos
        initialValues[filter.dateRangeFields.start] = '';
        initialValues[filter.dateRangeFields.end] = '';
      } else {
        initialValues[filter.field] = '';
      }
    });
    return initialValues;
  });
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });


  // Aplicar filtros customizados
  const filteredData = React.useMemo(() => {
    if (filters.length === 0) return tableData;
    
    
    return tableData.filter(row => {
      return filters.every(filter => {
        
        const value = filterValues[filter.field];
        
        // Para filtros de data range, verificar se há valores nas datas específicas
        if (filter.type === 'daterange' && filter.dateRangeFields) {
          const startDate = filterValues[filter.dateRangeFields.start];
          const endDate = filterValues[filter.dateRangeFields.end];
          // Se não há datas selecionadas, incluir o item
          if (!startDate && !endDate) return true;
        } else {
          // Se não há valor ou é a opção "Selecionar" (__SELECT_ALL__), incluir o item
          if (!value || value === '__SELECT_ALL__' || value.trim() === '') return true;
        }
        
        const cellValue = (row as Record<string, unknown>)[filter.field];
        if (cellValue === null || cellValue === undefined) return false;
        
        const cellValueStr = String(cellValue).toLowerCase();
        
        // Para filtros de data range
        if (filter.type === 'daterange' && filter.dateRangeFields) {
          const startDate = filterValues[filter.dateRangeFields.start];
          const endDate = filterValues[filter.dateRangeFields.end];
          
          
          // Se não há datas selecionadas, incluir o item
          if (!startDate && !endDate) return true;
          
          // Converter data da célula para Date
          let cellDate: Date | null = null;
          try {
            // Tentar parsear data no formato DD/MM/YYYY
            if (cellValueStr && cellValueStr !== '-' && cellValueStr !== '') {
              const [day, month, year] = cellValueStr.split('/');
              if (day && month && year) {
                cellDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              }
            }
          } catch {
            // Se não conseguir parsear, não incluir o item
            return false;
          }
          
          if (!cellDate || isNaN(cellDate.getTime())) return false;
          
          // Verificar se está dentro do range
          let isInRange = true;
          
          if (startDate) {
            // Parse da data no formato YYYY-MM-DD sem problemas de timezone
            const [year, month, day] = startDate.split('-').map(Number);
            const start = new Date(year, month - 1, day);
            if (cellDate < start) isInRange = false;
          }
          
          if (endDate) {
            // Parse da data no formato YYYY-MM-DD sem problemas de timezone
            const [year, month, day] = endDate.split('-').map(Number);
            const end = new Date(year, month - 1, day);
            end.setHours(23, 59, 59, 999);
            if (cellDate > end) isInRange = false;
          }
          
          
          return isInRange;
        }
        
        // Para outros tipos de filtros
        const filterValueStr = value.toLowerCase();
        
        // Para campos específicos que podem ter valores transformados, fazer comparação exata
        if (filter.field === 'app_planoatual') {
          // Mapear valores do filtro para labels dos planos
          const planoMap: Record<string, string> = {
            '1': 'básico',
            '2': 'premium', 
            '3': 'full'
          };
          const expectedLabel = planoMap[value] || value.toLowerCase();
          return cellValueStr === expectedLabel;
        }
        
        // Para campos de contrato (boolean transformado para string)
        if (filter.field === 'app_stauscontrato') {
          return cellValueStr === filterValueStr;
        }
        
        // Para campos booleanos (como issue_resolved)
        if (filter.field === 'issue_resolved') {
          const cellBool = String(cellValue) === 'true' || cellValue === true;
          const filterBool = filterValueStr === 'true';
          return cellBool === filterBool;
        }
        
        return cellValueStr.includes(filterValueStr);
      });
    });
  }, [tableData, filters, filterValues]);

  const table = useReactTable({
    data: filteredData,
    columns: enhancedColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    enableSorting: true,
    enableMultiSort: false, // Permitir apenas uma coluna ordenada por vez
    enableGlobalFilter: searchFields.length > 0,
    globalFilterFn: (row, columnId, value) => {
      if (!searchFields.length) return true;
      
      const searchValue = value.toLowerCase();
      return searchFields.some(field => {
        const cellValue = row.getValue(field);
        if (cellValue === null || cellValue === undefined) return false;
        return String(cellValue).toLowerCase().includes(searchValue);
      });
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
  });

  // Funções para gerenciar filtros
  const handleFilterChange = (field: string, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearAllFilters = () => {
    const clearedFilters: Record<string, string> = {};
    filters.forEach(filter => {
      // Apenas filtros do tipo 'select' recebem o valor padrão '__SELECT_ALL__'
      if (filter.type === 'select') {
        clearedFilters[filter.field] = '__SELECT_ALL__';
      } else if (filter.type === 'daterange' && filter.dateRangeFields) {
        // Para daterange, limpar ambos os campos
        clearedFilters[filter.dateRangeFields.start] = '';
        clearedFilters[filter.dateRangeFields.end] = '';
      } else {
        clearedFilters[filter.field] = '';
      }
    });
    setFilterValues(clearedFilters);
  };

  const hasActiveFilters = Object.values(filterValues).some(value => value && value !== '__SELECT_ALL__' && value.trim() !== '');
  

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setTableData((old) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(old, oldIndex, newIndex);
      });
    }
  }

  function exportTableToCSV<T>(columns: ColumnDef<T>[], table: ReturnType<typeof useReactTable<T>>) {
    const visibleColumns = table.getVisibleLeafColumns();
    const headers = visibleColumns.map((col) =>
      typeof col.columnDef.header === "string" ? col.columnDef.header : col.id
    );
    const rows = table.getFilteredRowModel().rows.map((row) =>
      visibleColumns.map((col) => row.getValue(col.id))
    );
    const csvContent =
      headers.join(",") +
      "\n" +
      rows.map((row) => row.map((cell) => `"${cell ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "tabela.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de pesquisa e controles */}
      {(searchFields.length > 0 || filters.length > 0) && (
        <div className="flex flex-col gap-4">
          {/* Filtros avançados */}
          {filters.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <IconFilter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtros:</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 items-end">
                  {filters.map((filter) => {
                   // Determinar as opções do filtro
                   const filterOptions = filter.dynamicOptions 
                     ? generateFilterOptions(data, filter.field)
                     : [
                         { value: '__SELECT_ALL__', label: 'Selecionar' },
                         ...(filter.options || [])
                       ];
                   
                   return (
                     <div key={filter.field} className="space-y-2">
                       <Label htmlFor={`filter-${filter.field}`} className="text-sm font-medium">
                         {filter.label}
                       </Label>
                       
                       {filter.type === 'select' && filterOptions.length > 0 ? (
                         <Select
                           value={filterValues[filter.field] || '__SELECT_ALL__'}
                           onValueChange={(value) => handleFilterChange(filter.field, value)}
                         >
                           <SelectTrigger className="w-full">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             {filterOptions.map((option) => (
                               <SelectItem key={option.value} value={option.value}>
                                 {option.label}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       ) : filter.type === 'daterange' && filter.dateRangeFields ? (
                         <DateRangePicker
                           startValue={filterValues[filter.dateRangeFields.start]}
                           endValue={filterValues[filter.dateRangeFields.end]}
                           onStartChange={(value) => handleFilterChange(filter.dateRangeFields!.start, value)}
                           onEndChange={(value) => handleFilterChange(filter.dateRangeFields!.end, value)}
                         startPlaceholder="Data início"
                         endPlaceholder="Data fim"
                       />
                     ) : filter.type === 'date' ? (
                       <DatePicker
                         value={filterValues[filter.field]}
                         onChange={(value) => handleFilterChange(filter.field, value)}
                         placeholder={`Selecionar ${filter.label.toLowerCase()}`}
                         className="w-40"
                       />
                     ) : (
                       <Input
                         id={`filter-${filter.field}`}
                         placeholder={filter.placeholder || `Filtrar por ${filter.label.toLowerCase()}`}
                         value={filterValues[filter.field] || ''}
                         onChange={(e) => handleFilterChange(filter.field, e.target.value)}
                         className="w-40"
                       />
                     )}
                   </div>
                   );
                 })}
                  {hasActiveFilters && (
                   <div className="flex items-end">
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={clearAllFilters}
                       className="text-muted-foreground hover:text-foreground"
                     >
                       <IconFilterOff className="h-4 w-4 mr-1" />
                       Limpar Filtros
                     </Button>
                   </div>
                  )}
                </div>
              </div>
          )}

          {/* Barra de pesquisa com controles */}
          {searchFields.length > 0 && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {globalFilter && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setGlobalFilter("")}
                    >
                      <IconX className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {globalFilter && (
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {table.getFilteredRowModel().rows.length} resultado(s) encontrado(s)
                  </div>
                )}
              </div>
              
              {/* Controles da tabela */}
              <div className="flex items-center gap-2">
                <Label htmlFor="columns-customize" className="sr-only">
                  Personalizar Colunas
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <IconLayoutColumns />
                      <span className="hidden lg:inline">Personalizar Colunas</span>
                      <span className="lg:hidden">Colunas</span>
                      <IconChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <ScrollArea className="h-64">
                      {table
                        .getAllColumns()
                        .filter(
                          (column) =>
                            typeof column.accessorFn !== "undefined" &&
                            column.getCanHide()
                        )
                        .map((column) => {
                          return (
                            <DropdownMenuCheckboxItem
                              key={column.id}
                              className="capitalize"
                              checked={column.getIsVisible()}
                              onCheckedChange={(value) =>
                                column.toggleVisibility(!!value)
                              }
                            >
                              {typeof column.columnDef.header === "string"
                                ? column.columnDef.header
                                : column.id}
                            </DropdownMenuCheckboxItem>
                          )
                        })}
                    </ScrollArea>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportTableToCSV(columns, table)}
                >
                  <IconDownload />
                  <span className="hidden lg:inline">Exportar CSV</span>
                </Button>
              </div>
            </div>
          )}
         </div>
       )}
      <div className="rounded-md border">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="text-center">
                        {header.isPlaceholder
                          ? null
                          : (
                              <SortableHeader column={header.column}>
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </SortableHeader>
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} rowClickUrl={rowClickUrl} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Sem resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>
      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} Linha(s) selecionada(s).
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Linhas por página</p>
            <Select
              value={table.getState().pagination.pageSize === table.getFilteredRowModel().rows.length ? "all" : `${table.getState().pagination.pageSize}`}
              onValueChange={(value: string) => {
                if (value === "all") {
                  table.setPageSize(table.getFilteredRowModel().rows.length)
                } else {
                  table.setPageSize(Number(value))
                }
              }}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
                <SelectItem key="all" value="all">
                  Todos
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
