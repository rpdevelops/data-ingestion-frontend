"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    return props.defaultMonth || new Date()
  })

  // Gerar opções de mês
  const months = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(2024, i, 1)
      return {
        value: i.toString(),
        label: format(date, 'MMMM', { locale: ptBR })
      }
    })
  }, [])

  // Gerar opções de ano (últimos 5 anos + próximos 5 anos)
  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 11 }, (_, i) => {
      const year = currentYear - 5 + i
      return {
        value: year.toString(),
        label: year.toString()
      }
    })
  }, [])

  const handleMonthChange = (monthValue: string) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(parseInt(monthValue))
    setCurrentMonth(newDate)
  }

  const handleYearChange = (yearValue: string) => {
    const newDate = new Date(currentMonth)
    newDate.setFullYear(parseInt(yearValue))
    setCurrentMonth(newDate)
  }

  return (
    <div className="">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        locale={ptBR}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "hidden", // Esconder o texto padrão
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell:
            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: () => <ChevronLeft className="h-4 w-4" />,
          IconRight: () => <ChevronRight className="h-4 w-4" />,
          Caption: () => (
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => {
                  const newDate = new Date(currentMonth)
                  newDate.setMonth(newDate.getMonth() - 1)
                  setCurrentMonth(newDate)
                }}
                className={cn(
                  "h-8 w-8 rounded-md border border-input bg-background",
                  "hover:bg-accent hover:text-accent-foreground",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                  "flex items-center justify-center"
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <Select value={currentMonth.getMonth().toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-8 w-[120px] text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={currentMonth.getFullYear().toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="h-8 w-[70px] text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <button
                onClick={() => {
                  const newDate = new Date(currentMonth)
                  newDate.setMonth(newDate.getMonth() + 1)
                  setCurrentMonth(newDate)
                }}
                className={cn(
                  "h-8 w-8 rounded-md border border-input bg-background",
                  "hover:bg-accent hover:text-accent-foreground",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                  "flex items-center justify-center"
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              
            </div>
          ),
        }}
        {...props}
      />
      
      {/* Botão Hoje na parte de baixo */}
      <div className="flex justify-center pb-2">
        <button
          onClick={() => {
            setCurrentMonth(new Date())
          }}
          className={cn(
            "text-sm text-muted-foreground hover:text-foreground",
            "underline-offset-4 hover:underline",
            "transition-colors duration-200",
            "focus:outline-none focus:underline"
          )}
        >
          Ir para hoje
        </button>
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
