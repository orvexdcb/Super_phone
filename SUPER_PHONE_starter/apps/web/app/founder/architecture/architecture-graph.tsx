"use client";

import { useMemo, useState } from "react";

type Props = {
  sourceFiles: string[];
  dependencies: { from: string; to: string; kind?: string }[];
  webRoutes: { route: string; file: string; type: string }[];
  mobileScreens: { name: string; file: string }[];
  mobileComponents: { name: string; file: string }[];
  tables: { name: string; columns: string[]; policies: string[]; rlsEnabled: boolean }[];
  relationships: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }[];
};

type Node = { id: string; title: string; path: string; group: string; kind: string; detail: string };

const filters = [
  { id: "all", label: "الكل" },
  { id: "web", label: "الويب" },
  { id: "mobile", label: "الهاتف" },
  { id: "shared", label: "المشترك" },
  { id: "database", label: "قاعدة البيانات" },
];

export default function ArchitectureGraph(props: Props) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const nodes = useMemo<Node[]>(() => {
    const routes = new Map(props.webRoutes.map((item) => [item.file, item]));
    const screens = new Map(props.mobileScreens.map((item) => [item.file, item]));
    const components = new Map(props.mobileComponents.map((item) => [item.file, item]));
    const files = props.sourceFiles.map((file) => {
      const route = routes.get(file);
      const screen = screens.get(file);
      const component = components.get(file);
      const group = file.includes("/apps/mobile/") ? "mobile" : file.includes("/packages/shared/") ? "shared" : "web";
      return {
        id: "file::" + file, title: route ? route.route : screen ? screen.name : component ? component.name : file.split("/").pop() || file,
        path: file, group, kind: route ? "مسار ويب" : screen ? "شاشة هاتف" : component ? "مكون هاتف" : group === "shared" ? "ملف مشترك" : group === "mobile" ? "ملف هاتف" : "ملف ويب",
        detail: route ? route.type : screen ? "شاشة مستوردة في تطبيق الهاتف" : component ? "مكون في تطبيق الهاتف" : file,
      };
    });
    const tables = props.tables.map((table) => ({
      id: "table::" + table.name, title: table.name, path: table.name, group: "database",
      kind: "جدول PostgreSQL", detail: table.columns.length + " عمود · " + table.policies.length + " سياسة",
    }));
    return [...files, ...tables].sort((a, b) => a.title.localeCompare(b.title));
  }, [props]);

  const visible = nodes.filter((node) =>
    (filter === "all" || node.group === filter) &&
    (!query || (node.title + " " + node.path + " " + node.kind).toLowerCase().includes(query.toLowerCase()))
  );
  const selected = nodes.find((node) => node.id === selectedId) || visible[0] || nodes[0];
  const filePath = selected && selected.group !== "database" ? selected.path : "";
  const tableName = selected && selected.group === "database" ? selected.path : "";
  const uses = filePath ? props.dependencies.filter((edge) => edge.from === filePath) : [];
  const usedBy = filePath ? props.dependencies.filter((edge) => edge.to === filePath) : [];
  const tableLinks = tableName ? props.relationships.filter((edge) => edge.fromTable === tableName || edge.toTable === tableName) : [];
  const tableData = tableName ? props.tables.find((table) => table.name === tableName) : undefined;

  function chooseFile(file: string) {
    setFilter(file.includes("/apps/mobile/") ? "mobile" : file.includes("/packages/shared/") ? "shared" : "web");
    setQuery("");
    setSelectedId("file::" + file);
  }

  function chooseTable(table: string) {
    setFilter("database");
    setQuery("");
    setSelectedId("table::" + table);
  }

  function fileLink(file: string, label: string) {
    return <button type="button" className="ag-link" key={label + file} onClick={() => chooseFile(file)}><span>{file.split("/").slice(-2).join("/")}</span><small>{label}</small></button>;
  }

  return (
    <section className="ag-box" aria-label="خريطة العلاقات التفاعلية">
      <style>{`
        .ag-box{display:grid;gap:12px}
        .ag-bar{display:flex;gap:7px;flex-wrap:wrap;align-items:center}
        .ag-filter{border:1px solid var(--line);background:#142338;color:#d6deea;border-radius:20px;padding:8px 12px;font:inherit;font-size:.77rem;cursor:pointer}
        .ag-filter[aria-pressed="true"]{border-color:var(--gold);color:var(--gold-light);background:rgba(216,173,94,.12)}
        .ag-search{flex:1 1 210px;min-width:160px;border:1px solid var(--line);border-radius:10px;background:#0e1a2a;color:white;padding:10px;font:inherit}
        .ag-layout{display:grid;grid-template-columns:minmax(220px,.8fr) minmax(0,1.5fr);gap:11px}
        .ag-panel{border:1px solid var(--line);border-radius:13px;background:#101e30;overflow:hidden;min-width:0}
        .ag-head{display:flex;justify-content:space-between;padding:12px;border-bottom:1px solid var(--line);color:var(--gold-light);font-size:.82rem}
        .ag-head small{color:var(--muted)}
        .ag-list{padding:7px;max-height:440px;overflow:auto}
        .ag-node{display:flex;gap:8px;align-items:flex-start;width:100%;padding:9px;border:1px solid transparent;border-radius:9px;background:transparent;color:#e8edf4;text-align:right;cursor:pointer;font:inherit}
        .ag-node[aria-pressed="true"]{background:rgba(216,173,94,.1);border-color:rgba(216,173,94,.5)}
        .ag-node:hover{background:#1a2b40}
        .ag-dot{width:8px;height:8px;flex:0 0 8px;border-radius:50%;margin-top:5px;background:#93a7bf}
        .ag-dot.mobile{background:#6ab8c8}.ag-dot.shared{background:#a4a2e1}.ag-dot.database{background:#d8ad5e}
        .ag-node span:last-child{display:grid;gap:3px;min-width:0}
        .ag-node strong{font-size:.78rem;overflow-wrap:anywhere}
        .ag-node small{font-size:.67rem;color:var(--muted);overflow-wrap:anywhere}
        .ag-content{padding:13px;display:grid;gap:12px}
        .ag-selected{padding:13px;border:1px solid rgba(216,173,94,.35);border-radius:11px;background:#1a2b40}
        .ag-selected small{color:var(--gold-light)}.ag-selected h3{margin:5px 0;font-size:1rem;overflow-wrap:anywhere}
        .ag-selected p,.ag-hint{margin:0;color:var(--muted);font-size:.73rem;line-height:1.7;overflow-wrap:anywhere}
        .ag-counts{display:flex;gap:7px;flex-wrap:wrap}
        .ag-count{border:1px solid var(--line);background:#17283d;border-radius:8px;padding:7px 9px;font-size:.72rem}
        .ag-columns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .ag-group{display:grid;gap:7px;min-width:0}.ag-group h4{margin:0;color:var(--gold-light);font-size:.78rem}
        .ag-link{display:flex;justify-content:space-between;gap:8px;align-items:center;width:100%;text-align:right;border:1px solid var(--line);border-radius:9px;background:#142338;color:#e5ebf3;padding:9px;font:inherit;cursor:pointer}
        .ag-link span{font-size:.73rem;overflow-wrap:anywhere}.ag-link small{color:var(--muted);font-size:.67rem;white-space:nowrap}
        .ag-link:hover{border-color:var(--gold)}
        .ag-empty{padding:18px;text-align:center;color:var(--muted);font-size:.78rem}
        @media(max-width:720px){.ag-layout{grid-template-columns:1fr}.ag-list{max-height:250px}.ag-columns{grid-template-columns:1fr}}
      `}</style>
      <div className="ag-bar">
        {filters.map((item) => <button key={item.id} type="button" className="ag-filter" aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setQuery(""); }}>{item.label}</button>)}
        <input className="ag-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن شاشة أو ملف أو جدول..." aria-label="البحث في عناصر الخريطة" />
      </div>
      <div className="ag-layout">
        <div className="ag-panel">
          <div className="ag-head"><strong>عناصر المشروع</strong><small>{visible.length} عنصر</small></div>
          <div className="ag-list">
            {visible.length ? visible.map((node) => <button type="button" key={node.id} className="ag-node" aria-pressed={selected?.id === node.id} onClick={() => setSelectedId(node.id)}>
              <i className={"ag-dot " + node.group} />
              <span><strong>{node.title}</strong><small>{node.kind} · {node.path.split("/").slice(-2).join("/")}</small></span>
            </button>) : <div className="ag-empty">لا توجد نتائج مطابقة.</div>}
          </div>
        </div>
        <div className="ag-panel">
          <div className="ag-head"><strong>تحليل العنصر المحدد</strong><small>العلاقات المباشرة</small></div>
          {selected ? <div className="ag-content">
            <div className="ag-selected"><small>{selected.kind}</small><h3>{selected.title}</h3><p>{selected.detail}</p></div>
            <div className="ag-counts">
              {tableName ? <>
                <span className="ag-count">{tableData?.columns.length || 0} عمود</span>
                <span className="ag-count">{tableData?.policies.length || 0} سياسة</span>
                <span className="ag-count">{tableLinks.length} علاقة خارجية</span>
              </> : <>
                <span className="ag-count">{uses.length} اعتماديات يستخدمها</span>
                <span className="ag-count">{usedBy.length} ملفات تعتمد عليه</span>
              </>}
            </div>
            {tableName ? <>
              <div className="ag-group"><h4>أعمدة الجدول</h4><div className="ag-counts">{(tableData?.columns || []).map((column) => <span className="ag-count" key={column}>{column}</span>)}</div></div>
              <div className="ag-group"><h4>الجداول المرتبطة</h4>
                {tableLinks.length ? tableLinks.map((edge, index) => {
                  const other = edge.fromTable === tableName ? edge.toTable : edge.fromTable;
                  const label = edge.fromTable === tableName ? edge.fromColumn + " ← " + edge.toTable + "." + edge.toColumn : edge.fromTable + "." + edge.fromColumn + " ← " + edge.toColumn;
                  return <button className="ag-link" key={index} type="button" onClick={() => chooseTable(other)}><span>{label}</span><small>فتح {other}</small></button>;
                }) : <p className="ag-hint">لا توجد علاقة مفاتيح خارجية مباشرة مكتشفة.</p>}
              </div>
              <p className="ag-hint">العلاقات مستخرجة من ملفات SQL في المستودع ولا تنفذ أي تعديل على قاعدة البيانات.</p>
            </> : <div className="ag-columns">
              <div className="ag-group"><h4>يعتمد على ({uses.length})</h4>{uses.length ? uses.map((edge) => fileLink(edge.to, "ملف مستخدم")) : <p className="ag-hint">لا توجد استيرادات محلية مباشرة.</p>}</div>
              <div className="ag-group"><h4>ملفات تعتمد عليه ({usedBy.length})</h4>{usedBy.length ? usedBy.map((edge) => fileLink(edge.from, "قد يتأثر بالتغيير")) : <p className="ag-hint">لا توجد ملفات مستوردة مباشرة.</p>}</div>
            </div>}
            <p className="ag-hint">اختر أي عنصر من القائمة أو الروابط للتنقل وتحليل علاقاته. التأثير المعروض مباشر، ولا يشمل كل التأثيرات غير المباشرة.</p>
          </div> : <div className="ag-empty">لا توجد عناصر في لقطة المشروع.</div>}
        </div>
      </div>
    </section>
  );
}
