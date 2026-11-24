"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { PALETTE } from "./utils";

export type Slice = { name: string; value: number };

function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${x0},${y0}A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1}`;
}

export function DonutChart({ data, centerLabel }: { data: Slice[]; centerLabel: string }) {
  const { taka, num } = useLang();
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 200, r = 74, gap = 0.05;
  let acc = -Math.PI / 2;
  const arcs = data.map((d) => {
    const span = (d.value / Math.max(total, 1)) * Math.PI * 2;
    const a0 = acc + gap / 2, a1 = acc + span - gap / 2;
    acc += span;
    return { a0, a1 };
  });
  const active = hover !== null ? data[hover] : null;

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label="Donut chart">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={20} />
          {arcs.map((a, i) => (
            <motion.path
              key={i}
              d={arc(size / 2, size / 2, r, a.a0, a.a1)}
              fill="none"
              stroke={PALETTE[i % PALETTE.length]}
              strokeLinecap="round"
              animate={{ strokeWidth: hover === i ? 26 : 20, opacity: hover === null || hover === i ? 1 : 0.35 }}
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ pathLength: { duration: 1.1, delay: i * 0.12, ease: "easeOut" }, strokeWidth: { duration: 0.2 }, opacity: { duration: 0.2 } }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 truncate max-w-[130px]">{active ? active.name : centerLabel}</p>
          <p className="mt-0.5 text-xl font-bold text-slate-900">{taka(active ? active.value : total, true)}</p>
          {active && <p className="text-xs font-semibold text-slate-500">{num(active.value / Math.max(total, 1), { style: "percent", maximumFractionDigits: 1 })}</p>}
        </div>
      </div>
      <ul className="w-full space-y-1">
        {data.map((d, i) => (
          <li
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className={`flex cursor-default items-center justify-between rounded-xl px-3 py-1.5 text-xs transition ${hover === i ? "bg-slate-100" : ""}`}
          >
            <span className="flex items-center gap-2 text-slate-600 truncate min-w-0 mr-2">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="font-semibold text-slate-900 shrink-0">{num(d.value / Math.max(total, 1), { style: "percent", maximumFractionDigits: 0 })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
