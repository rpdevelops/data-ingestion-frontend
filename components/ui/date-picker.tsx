"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecionar data",
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Função para formatar data para o DatePicker
  const formatDateForPicker = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    // Parse da data no formato YYYY-MM-DD sem problemas de timezone
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Função para formatar data do DatePicker para string
  const formatDateFromPicker = (date: Date | undefined): string => {
    if (!date) return '';
    // Formato YYYY-MM-DD sem problemas de timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDate = formatDateForPicker(value || '');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            format(selectedDate!, "dd/MM/yyyy", { locale: ptBR })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onChange?.(formatDateFromPicker(date));
              setOpen(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

interface DateRangePickerProps {
  startValue?: string
  endValue?: string
  onStartChange?: (value: string) => void
  onEndChange?: (value: string) => void
  startPlaceholder?: string
  endPlaceholder?: string
  className?: string
  disabled?: boolean
}

export function DateRangePicker({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startPlaceholder = "Data início",
  endPlaceholder = "Data fim",
  className,
  disabled = false,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Função para formatar data para o DatePicker
  const formatDateForPicker = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    // Parse da data no formato YYYY-MM-DD sem problemas de timezone
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Função para formatar data do DatePicker para string
  const formatDateFromPicker = (date: Date | undefined): string => {
    if (!date) return '';
    // Formato YYYY-MM-DD sem problemas de timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedStartDate = formatDateForPicker(startValue || '');
  const selectedEndDate = formatDateForPicker(endValue || '');

  // Criar range para o Calendar
  const selectedRange: DateRange | undefined = React.useMemo(() => {
    if (selectedStartDate && selectedEndDate) {
      return {
        from: selectedStartDate,
        to: selectedEndDate
      };
    } else if (selectedStartDate) {
      return {
        from: selectedStartDate,
        to: undefined
      };
    }
    return undefined;
  }, [selectedStartDate, selectedEndDate]);

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      onStartChange?.(formatDateFromPicker(range.from));
    } else {
      onStartChange?.('');
    }
    
    if (range?.to) {
      onEndChange?.(formatDateFromPicker(range.to));
    } else {
      onEndChange?.('');
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              (!startValue && !endValue) && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startValue && endValue ? (
              <span>
                {format(selectedStartDate!, "dd/MM/yyyy", { locale: ptBR })} - {format(selectedEndDate!, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            ) : startValue ? (
              <span>
                {format(selectedStartDate!, "dd/MM/yyyy", { locale: ptBR })} - {endPlaceholder}
              </span>
            ) : (
              <span>{startPlaceholder} - {endPlaceholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={selectedRange}
            onSelect={handleRangeSelect}
            numberOfMonths={1}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
