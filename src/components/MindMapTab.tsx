"use client";

import { useState, useEffect, useRef } from 'react';
import { useNotesStore } from '@/store/notesStore';
import * as d3 from 'd3';

export default function MindMapTab() {
  const { rawText } = useNotesStore();
  const [treeData, setTreeData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const generateMap = async () => {
    if (!rawText) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });
      if (!res.ok) throw new Error('Failed to generate mind map');
      const data = await res.json();
      setTreeData(data);
    } catch (err) {
      console.error(err);
      alert('Failed to generate mind map.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!treeData || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = 600;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", "100%")
      .attr("height", height);
      
    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
      
    svg.call(zoom);

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().size([height - 100, width - 250]);
    treeLayout(root);

    // Initial Zoom/Pan to center the map
    svg.call(zoom.transform, d3.zoomIdentity.translate(80, 50));

    // Links
    g.selectAll(".link")
      .data(root.links())
      .join("path")
      .attr("class", "link")
      .attr("d", d3.linkHorizontal()
        .x((d: any) => d.y)
        .y((d: any) => d.x) as any)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.15)")
      .attr("stroke-width", 2);

    // Nodes
    const node = g.selectAll(".node")
      .data(root.descendants())
      .join("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    node.append("circle")
      .attr("r", (d) => d.depth === 0 ? 8 : (d.children ? 6 : 4))
      .attr("fill", (d) => d.depth === 0 ? "#fad96d" : (d.children ? "#7c6dfa" : "#fa6d8c"))
      .attr("stroke", "#111118")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0 0 5px rgba(250,217,109,0.5))");

    node.append("text")
      .attr("dy", "0.31em")
      .attr("x", (d) => d.children ? -12 : 12)
      .attr("text-anchor", (d) => d.children ? "end" : "start")
      .text((d: any) => d.data.name)
      .attr("fill", "#e8e8f0")
      .attr("font-size", (d) => d.depth === 0 ? "16px" : (d.children ? "14px" : "12px"))
      .attr("font-weight", (d) => d.depth === 0 ? "bold" : "normal")
      .attr("font-family", "system-ui, -apple-system, sans-serif")
      .clone(true).lower()
      .attr("stroke", "#111118")
      .attr("stroke-width", 4)
      .attr("stroke-linejoin", "round");

  }, [treeData]);

  return (
    <div className="w-full bg-[#111118] border border-white/10 rounded-2xl p-6 shadow-xl relative min-h-[500px]" ref={containerRef}>
      {!treeData ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
          <div className="w-16 h-16 bg-[#fad96d]/10 text-[#fad96d] rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(250,217,109,0.2)]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-[#e8e8f0]">Interactive Mind Map</h3>
          <p className="text-gray-400 max-w-sm mx-auto">Visualize your notes as a beautiful hierarchical tree graph using D3.js. Perfect for understanding core connections.</p>
          
          <button
            onClick={generateMap}
            disabled={isGenerating || !rawText}
            className="px-6 py-3 text-sm font-semibold bg-[#fad96d] text-black hover:bg-[#ffe17d] rounded-xl shadow-[0_0_15px_rgba(250,217,109,0.4)] disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isGenerating ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span> Structuring...</> : 'Generate Mind Map'}
          </button>
        </div>
      ) : (
        <div className="relative w-full h-[600px] overflow-hidden rounded-xl border border-white/5 bg-black/30 animate-fade-in cursor-grab active:cursor-grabbing">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button onClick={generateMap} className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm border border-white/10">
              Regenerate Graph
            </button>
          </div>
          <p className="absolute bottom-4 right-4 text-xs text-gray-500 font-mono z-10">Scroll to zoom • Drag to pan</p>
          <svg ref={svgRef} className="w-full h-full block"></svg>
        </div>
      )}
    </div>
  );
}
