"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  //CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"

interface AreaChartGenericProps {
  data: Array<Record<string, number | string | null>>;
  categories: string[]; // ex: ["Básico", "Premium", "Full"]
  dataKey: string; // ex: "date" ou "mes"
  title?: string;
  description?: string;
  colors?: Record<string, string>; // ex: { Básico: "#color", ... }
}

export function AreaChartGeneric({
  data,
  categories,
  dataKey,
  title = "",
  description = "",
  colors,
}: AreaChartGenericProps) {

  return (
    <Card className="@container/card">
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={{}}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={data}>
            <defs>
              {categories.map(cat => (
                <linearGradient key={cat} id={`fill${cat}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={colors?.[cat] || "var(--primary)"}
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor={colors?.[cat] || "var(--primary)"}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={dataKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("pt-BR", {
                  month: "short",
                  day: "numeric",
                  year: "2-digit",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={10}
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                
                // Calcular total de apps
                const total = payload.reduce((sum, entry) => {
                  return sum + (typeof entry.value === 'number' ? entry.value : 0);
                }, 0);
                
                return (
                  <div className="rounded-lg border bg-background p-3 shadow-md">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {label ? new Date(label).toLocaleDateString("pt-BR", {
                            month: "short",
                            day: "numeric",
                            year: "2-digit",
                          }) : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Total: {total} apps
                        </span>
                      </div>
                      <div className="grid gap-1">
                        {payload.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ 
                                backgroundColor: entry.color,
                                opacity: 0.8
                              }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {entry.dataKey}:
                            </span>
                            <span className="text-xs font-medium">
                              {typeof entry.value === 'number' ? entry.value : 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            {categories.map(cat => (
              <Area
                key={cat}
                dataKey={cat}
                type="natural"
                fill={`url(#fill${cat})`}
                stroke={colors?.[cat] || "var(--primary)"}
                stackId="a"
              />
            ))}
          </AreaChart>
        </ChartContainer>
        
        {/* Legenda de cores */}
        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6 mt-6 pt-4 border-t">
            {categories.map(cat => (
              <div key={cat} className="flex items-center gap-3 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ 
                    backgroundColor: colors?.[cat] || "var(--primary)",
                    opacity: 0.8
                  }}
                />
                <span className="text-muted-foreground font-medium">{cat}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
