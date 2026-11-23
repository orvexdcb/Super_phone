"use client";

import { useMemo, useState } from "react";

type Table = { name: string; columns: string[]; policies: string[]; rlsEnabled: boolean; migration?: string };
type Route = { route: string; file: string; type: string; imports: string[] };
type Policy = { name: string; table: string };
type Props = {
  sourceFiles: string[];
  routes: Route[];
  tables: Table[];
  relationships: { fromTable: string; fromColumn: string; toTable: string; toColumn: string }[];
  policies: Policy[];
  functions: { name: string; migration: string }[];
  triggers: { name: string; table: string; function: string; migration: string }[];
};

function includesAny(value: string, words: string[]) {
  return words.some((word) => value.toLowerCase().includes(word.toLowerCase()));
}

export default function ArchitectureAssistant(props: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ title: string; body: string; sources: string[] } | null>(null);

  const suggestions = useMemo(() => [
    "ما الجداول المرتبطة بالإعلانات؟",
    "أين توجد مسارات تسجيل الدخول؟",
    "ما سياسات الوصول لجدول listings؟",
    "ما الدوال والمحفزات الموجودة؟",
    "ما الملفات التي تخص متجر الإكسسوارات؟",
  ], []);

  function ask(raw: string) {
    const q = raw.trim();
    if (!q) return;
    const lower = q.toLowerCase();
    const tableRows: Table[] = props.tables as Table[];
    const tableMention: Table | undefined = tableRows.find((table: Table) => lower.includes(table.name.toLowerCase()));
    const routeMatches = props.routes.filter((route) =>
      includesAny(lower, [route.route.toLowerCase(), route.file.split("/").pop()!.toLowerCase()]) ||
      (includesAny(lower, ["دخول", "تسجيل", "login", "auth"]) && includesAny(route.route, ["login", "auth"]))
    );
    const fileMatches = props.sourceFiles.filter((file) =>
      includesAny(lower, ["إكسسوارات", "اكسسوارات", "accessor"]) && file.toLowerCase().includes("accessor") ||
      includesAny(lower, ["مؤسس", "founder"]) && file.toLowerCase().includes("founder")
    ).slice(0, 12);

    if (tableMention) {
      const links = props.relationships.filter((edge) => edge.fromTable === tableMention.name || edge.toTable === tableMention.name);
      const policies = props.policies.filter((policy) => policy.table === tableMention.name);
      setAnswer({
        title: "الجدول: " + tableMention.name,
        body: [
          "الأعمدة: " + tableMention.columns.join("، "),
          "حالة RLS حسب ملفات الترحيل: " + (tableMention.rlsEnabled ? "مفعّل" : "غير مثبت أنه مفعّل"),
          "سياسات الوصول: " + (policies.map((item) => item.name).join("، ") || "لم تُستخرج سياسة لهذا الجدول"),
          "العلاقات: " + (links.map((edge) => edge.fromTable + "." + edge.fromColumn + " ← " + edge.toTable + "." + edge.toColumn).join("؛ ") || "لا توجد علاقات مفاتيح خارجية مكتشفة"),
          "ملف الترحيل: " + (tableMention.migration || "غير محدد"),
        ].join("\n"),
        sources: ["قاعدة بيانات المستودع: " + tableMention.name, ...links.map((edge) => edge.fromTable + " → " + edge.toTable)],
      });
      return;
    }

    if (includesAny(lower, ["جدول", "جداول", "database", "table", "الإعلانات", "اعلانات"])) {
      const matches = props.tables.filter((table) => includesAny(lower, ["إكسسوارات", "اكسسوارات", "accessor"]) ? table.name.includes("accessory") : includesAny(table.name, ["listing", "category", "profile", "favorite", "report"]));
      setAnswer({
        title: "الجداول المكتشفة",
        body: matches.map((table) => table.name + " — " + table.columns.length + " عمود، " + table.policies.length + " سياسة، RLS: " + (table.rlsEnabled ? "مفعّل في الترحيلات" : "غير مثبت")).join("\n"),
        sources: matches.map((table) => table.name + " · " + (table.migration || "migration غير محدد")),
      });
      return;
    }

    if (includesAny(lower, ["سياسة", "سياسات", "rls", "policy", "صلاحية", "وصول"])) {
      const policyRows: Policy[] = props.policies;
      const matches = tableMention
        ? policyRows.filter((item) => item.table === tableMention.name)
        : policyRows.filter((item) => !lower.includes("إكسسوارات") || item.table.includes("accessory"));
      setAnswer({ title: "سياسات الوصول المستخرجة", body: matches.map((item) => item.name + " — " + item.table).join("\n") || "لم أجد سياسة مطابقة في بيانات المستودع.", sources: matches.map((item) => item.table + " / " + item.name) });
      return;
    }

    if (includesAny(lower, ["دالة", "دوال", "function", "محفز", "محفزات", "trigger"])) {
      const items = [
        ...props.functions.map((item) => "دالة " + item.name + " — " + item.migration),
        ...props.triggers.map((item) => "محفز " + item.name + " على " + item.table + " يستدعي " + item.function),
      ];
      setAnswer({ title: "دوال ومحفزات قاعدة البيانات", body: items.join("\n"), sources: [...props.functions.map((item) => item.migration), ...props.triggers.map((item) => item.migration)] });
      return;
    }

    if (routeMatches.length || includesAny(lower, ["مسار", "مسارات", "شاشة", "تسجيل", "دخول", "login"])) {
      const matches = routeMatches.length ? routeMatches : props.routes.filter((route) => includesAny(route.route + " " + route.file, ["login", "auth", "register", "signup"]));
      setAnswer({ title: "مسارات الويب المطابقة", body: matches.map((route) => route.route + " — " + route.type + "\nالملف: " + route.file + "\nالاستيرادات المحلية: " + route.imports.length).join("\n\n") || "لم أعثر على مسار يطابق هذا الوصف في اللقطة الحالية.", sources: matches.map((route) => route.file) });
      return;
    }

    if (fileMatches.length) {
      setAnswer({ title: "ملفات مطابقة في المستودع", body: fileMatches.join("\n"), sources: fileMatches });
      return;
    }

    setAnswer({
      title: "لم أجد إجابة مؤكدة في اللقطة الحالية",
      body: "أستطيع الإجابة عن أسماء الجداول وأعمدتها وعلاقاتها وسياسات RLS والدوال والمحفزات ومسارات الويب والملفات المفهرسة. اذكر اسم جدول أو مسار أو مصطلحاً موجوداً في المستودع. هذه الأداة تبحث في بيانات الفهرسة ولا تنفذ استعلامات مباشرة على Supabase ولا تحلل سلوك التطبيق وقت التشغيل.",
      sources: ["لقطة المستودع المولدة آلياً"],
    });
  }

  return (
    <section className="aa-box" aria-label="اسأل عن هندسة المشروع">
      <style>{`
        .aa-box{display:grid;gap:12px}.aa-intro{color:var(--muted);font-size:.82rem;line-height:1.8;margin:0}
        .aa-inputrow{display:flex;gap:8px;flex-wrap:wrap}.aa-input{flex:1 1 230px;min-width:0;border:1px solid var(--line);border-radius:10px;background:#0e1a2a;color:#fff;padding:12px;font:inherit}
        .aa-submit{border:1px solid var(--gold);border-radius:10px;background:rgba(216,173,94,.13);color:var(--gold-light);padding:10px 16px;font:inherit;font-weight:700;cursor:pointer}
        .aa-suggestions{display:flex;gap:7px;flex-wrap:wrap}.aa-suggestion{border:1px solid var(--line);border-radius:20px;background:#142338;color:#dce4ef;padding:7px 10px;font:inherit;font-size:.74rem;cursor:pointer}
        .aa-answer{border:1px solid rgba(216,173,94,.35);border-radius:12px;background:#142338;padding:13px;display:grid;gap:9px}
        .aa-answer h3{margin:0;color:var(--gold-light);font-size:.92rem}.aa-body{white-space:pre-wrap;overflow-wrap:anywhere;color:#e7edf5;font-size:.8rem;line-height:1.85}
        .aa-sources{display:flex;gap:6px;flex-wrap:wrap}.aa-source{font-size:.68rem;color:var(--muted);border:1px solid var(--line);border-radius:7px;padding:4px 7px;overflow-wrap:anywhere}
      `}</style>
      <p className="aa-intro">اسأل عن البنية اعتماداً على فهرس المستودع الحالي. الإجابات مستخرجة من الملفات المسجلة، وليست تحليلاً حياً لقاعدة البيانات أو تشغيل التطبيق.</p>
      <form className="aa-inputrow" onSubmit={(event) => { event.preventDefault(); ask(question); }}>
        <input className="aa-input" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="مثال: ما الجداول المرتبطة بالإعلانات؟" aria-label="اكتب سؤالك عن هندسة المشروع" />
        <button className="aa-submit" type="submit">اسأل</button>
      </form>
      <div className="aa-suggestions">{suggestions.map((item) => <button type="button" className="aa-suggestion" key={item} onClick={() => { setQuestion(item); ask(item); }}>{item}</button>)}</div>
      {answer && <div className="aa-answer" aria-live="polite"><h3>{answer.title}</h3><div className="aa-body">{answer.body}</div><div className="aa-sources">{answer.sources.filter(Boolean).slice(0, 12).map((source, index) => <span className="aa-source" key={source + index}>{source}</span>)}</div></div>}
    </section>
  );
}
