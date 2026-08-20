/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";

interface PlotlyChartProps {
  id: string;
  data: any[];
  layout: Record<string, any>;
  config?: Record<string, any>;
  className?: string;
}

export default function PlotlyChart({
  id,
  data,
  layout,
  config = { responsive: true, displayModeBar: "hover", displaylogo: false },
  className = "w-full h-[350px]"
}: PlotlyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  useEffect(() => {
    const renderChart = async () => {
      // Check if Plotly is loaded on window
      const plotly = (window as any).Plotly;
      if (!plotly || !containerRef.current) {
        return;
      }

      // Add elegant dark theme configurations to layout automatically
      const themedLayout = {
        ...layout,
        paper_bgcolor: "rgba(0,0,0,0)", // Transparent background for Glassmorphism cards
        plot_bgcolor: "rgba(0,0,0,0)",
        font: {
          family: "Inter, sans-serif",
          color: "#cbd5e1", // text-slate-300
          size: 11,
          ...layout.font,
        },
        margin: {
          t: 40,
          r: 20,
          b: 40,
          l: 50,
          pad: 4,
          ...layout.margin,
        },
        xaxis: {
          gridcolor: "rgba(255,255,255,0.06)",
          zerolinecolor: "rgba(255,255,255,0.1)",
          tickcolor: "rgba(255,255,255,0.1)",
          ...layout.xaxis,
        },
        yaxis: {
          gridcolor: "rgba(255,255,255,0.06)",
          zerolinecolor: "rgba(255,255,255,0.1)",
          tickcolor: "rgba(255,255,255,0.1)",
          ...layout.yaxis,
        },
      };

      try {
        chartInstanceRef.current = await plotly.newPlot(
          containerRef.current,
          data,
          themedLayout,
          config
        );
      } catch (err) {
        console.error("Error rendering Plotly chart:", err);
      }
    };

    // Render the chart on load and data/layout modifications
    renderChart();

    // Clean up chart instance when component is unmounted
    return () => {
      const plotly = (window as any).Plotly;
      if (plotly && containerRef.current) {
        try {
          plotly.purge(containerRef.current);
        } catch (e) {
          // Ignore silent purge failures during fast HMR swaps
        }
      }
    };
  }, [data, layout, config]);

  // Handle responsive resizing automatically
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      const plotly = (window as any).Plotly;
      if (plotly && containerRef.current && chartInstanceRef.current) {
        try {
          plotly.Plots.resize(containerRef.current);
        } catch (e) {
          // Ignore silent resize exceptions during layout swaps
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div id={id} ref={containerRef} className={className} />
    </div>
  );
}
