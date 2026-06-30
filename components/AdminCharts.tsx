"use client";

import React, { useMemo } from "react";

// Types
interface ChartDataItem {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartDataItem[];
}

interface LineChartProps {
  data: ChartDataItem[];
}

interface DoughnutChartProps {
  data: ChartDataItem[];
}

// ------------------------------------------------------------
// 1. BAR CHART: Citas por Especialidad (SVG)
// ------------------------------------------------------------
export function BarChart({ data }: BarChartProps) {
  const maxVal = useMemo(() => {
    const values = data.map((d) => d.value);
    return Math.max(...values, 5); // default to 5 to avoid division by zero
  }, [data]);

  const height = 240;
  const paddingLeft = 110;
  const paddingRight = 40;
  const paddingTop = 20;
  const paddingBottom = 20;
  const rowHeight = 35;
  const chartHeight = Math.max(data.length * rowHeight + paddingTop + paddingBottom, height);

  return (
    <div className="w-full">
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-text-muted">
          Sin datos de especialidades
        </div>
      ) : (
        <div className="relative overflow-x-auto">
          <svg viewBox={`0 0 500 ${chartHeight}`} className="w-full h-auto min-w-[320px]">
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--color-primary-light, #38bdf8)" stopOpacity="0.85" />
                <stop offset="100%" stopColor="var(--color-primary, #0b5cab)" stopOpacity="1" />
              </linearGradient>
            </defs>

            {data.map((item, idx) => {
              const y = paddingTop + idx * rowHeight;
              const barWidth = maxVal > 0 ? (item.value / maxVal) * (500 - paddingLeft - paddingRight) : 0;

              return (
                <g key={item.label} className="group">
                  {/* Grid Line */}
                  <line
                    x1={paddingLeft}
                    y1={y + 14}
                    x2={500 - paddingRight}
                    y2={y + 14}
                    stroke="currentColor"
                    className="text-border-subtle/30"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />

                  {/* Label */}
                  <text
                    x={paddingLeft - 12}
                    y={y + 18}
                    textAnchor="end"
                    className="fill-foreground text-xs font-semibold select-none"
                  >
                    {item.label}
                  </text>

                  {/* Bar Background for Hover */}
                  <rect
                    x={paddingLeft}
                    y={y}
                    width={500 - paddingLeft - paddingRight}
                    height={28}
                    fill="transparent"
                    className="group-hover:fill-foreground/[0.02] transition-colors duration-150 rounded-lg cursor-pointer"
                  />

                  {/* Bar */}
                  <rect
                    x={paddingLeft}
                    y={y + 4}
                    width={Math.max(barWidth, 4)}
                    height={20}
                    rx="4"
                    fill="url(#barGradient)"
                    className="transition-all duration-500 ease-out origin-left scale-x-100 group-hover:brightness-110 cursor-pointer"
                  />

                  {/* Value */}
                  <text
                    x={paddingLeft + barWidth + 8}
                    y={y + 18}
                    className="fill-foreground text-xs font-bold select-none"
                  >
                    {item.value}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// 2. LINE CHART: Reservaciones en los Últimos 7 Días
// ------------------------------------------------------------
export function LineChart({ data }: LineChartProps) {
  const maxVal = useMemo(() => {
    const values = data.map((d) => d.value);
    return Math.max(...values, 5);
  }, [data]);

  const width = 500;
  const height = 240;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const points = useMemo(() => {
    if (data.length === 0) return [];
    const stepX = (width - paddingLeft - paddingRight) / (data.length - 1 || 1);
    
    return data.map((d, index) => {
      const x = paddingLeft + index * stepX;
      const y = height - paddingBottom - (maxVal > 0 ? (d.value / maxVal) * (height - paddingTop - paddingBottom) : 0);
      return { x, y, value: d.value, label: d.label };
    });
  }, [data, maxVal]);

  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, "");
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return "";
    const baseLineY = height - paddingBottom;
    return `${pathD} L ${points[points.length - 1].x} ${baseLineY} L ${points[0].x} ${baseLineY} Z`;
  }, [points, pathD]);

  // Horizontal Gridlines
  const yGridTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full">
      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-text-muted">
          Sin datos de demanda semanal
        </div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary, #0b5cab)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-primary, #0b5cab)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis Labels */}
          {yGridTicks.map((tick) => {
            const y = paddingTop + (1 - tick) * (height - paddingTop - paddingBottom);
            const val = Math.round(tick * maxVal);
            return (
              <g key={tick} className="text-border-subtle/30">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-text-muted text-[10px] select-none font-semibold"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area under line */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Smooth line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-primary, #0b5cab)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots on line */}
          {points.map((p, idx) => (
            <g key={idx} className="group">
              {/* Pulse circle on hover */}
              <circle
                cx={p.x}
                cy={p.y}
                r="10"
                fill="transparent"
                className="group-hover:fill-primary/20 transition-all duration-150 cursor-pointer"
              />
              {/* Main dot */}
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="var(--color-primary, #0b5cab)"
                stroke="white"
                strokeWidth="1.5"
                className="group-hover:scale-125 transition-transform duration-150 cursor-pointer"
              />
              {/* Tooltip background */}
              <rect
                x={p.x - 16}
                y={p.y - 25}
                width="32"
                height="18"
                rx="4"
                className="fill-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              />
              {/* Tooltip text */}
              <text
                x={p.x}
                y={p.y - 13}
                textAnchor="middle"
                className="fill-background text-[9px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity duration-150 select-none"
              >
                {p.value}
              </text>
            </g>
          ))}

          {/* X Axis Labels */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - 12}
              textAnchor="middle"
              className="fill-text-muted text-[10px] font-semibold select-none"
            >
              {p.label}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// 3. DOUGHNUT CHART: Citas por Estado (SVG)
// ------------------------------------------------------------
export function DoughnutChart({ data }: DoughnutChartProps) {
  const total = useMemo(() => {
    return data.reduce((acc, d) => acc + d.value, 0);
  }, [data]);

  // HSL colors suited to state status
  const colorMap: Record<string, string> = {
    confirmada: "#10b981", // Success green
    pendiente: "#f59e0b",  // Amber warning
    cancelada: "#ef4444",  // Danger red
  };

  const labelMap: Record<string, string> = {
    confirmada: "Confirmadas",
    pendiente: "Pendientes",
    cancelada: "Canceladas",
  };

  // Center radius
  const radius = 55;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Compute angles
  const slices = useMemo(() => {
    let currentOffset = 0;
    
    return data.map((d) => {
      const percentage = total > 0 ? d.value / total : 0;
      const strokeLength = percentage * circumference;
      const offset = currentOffset;
      currentOffset += strokeLength;

      return {
        label: d.label,
        value: d.value,
        percentage: Math.round(percentage * 100),
        strokeLength,
        strokeOffset: -offset,
        color: colorMap[d.label] || "#3b82f6",
      };
    });
  }, [data, total, circumference]);

  return (
    <div className="w-full flex flex-col xs:flex-row items-center justify-center gap-6 py-2">
      {total === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-text-muted w-full">
          Sin citas reservadas
        </div>
      ) : (
        <>
          {/* SVG Doughnut */}
          <div className="relative w-40 h-40 shrink-0">
            <svg viewBox="0 0 140 140" className="w-full h-full transform -rotate-90">
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="var(--color-border-subtle, #e2e8f0)"
                strokeWidth={strokeWidth}
                className="dark:stroke-neutral-800"
              />
              {slices.map((slice, idx) => (
                <circle
                  key={idx}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${slice.strokeLength} ${circumference}`}
                  strokeDashoffset={slice.strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-700 ease-out origin-center"
                />
              ))}
            </svg>
            {/* Center Absolute Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
              <span className="text-2xl font-black text-foreground leading-none">{total}</span>
              <span className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider font-bold">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3.5 min-w-[120px]">
            {slices.map((slice, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-xs font-semibold text-foreground truncate">
                    {labelMap[slice.label] || slice.label}
                  </span>
                </div>
                <div className="text-right text-xs">
                  <span className="font-extrabold text-foreground">{slice.value}</span>
                  <span className="text-text-muted/60 text-[10px] ml-1 font-medium">({slice.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
