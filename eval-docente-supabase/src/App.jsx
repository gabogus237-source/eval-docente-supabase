import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase"
import './index.css'

// 👇 Correos con permiso para ver la pestaña "Resultados"
const ADMIN_EMAILS = ["gghermosa@uce.edu.ec"];

const DIMENSIONS = [
  { id: "didactica", name: "Didáctica y claridad", qs: ["q1","q2"] },
  { id: "comunicacion", name: "Comunicación y respeto", qs: ["q3","q4"] },
  { id: "evaluacion", name: "Evaluación justa y retroalimentación", qs: ["q5","q6"] },
  { id: "organizacion", name: "Organización y recursos", qs: ["q7","q8"] },
  { id: "inclusion", name: "Inclusión y enfoque de género", qs: ["q9","q10"] },
  { id: "etica", name: "Ética y responsabilidad", qs: ["q11","q12"] },
];

const QUESTIONS = [
  { id: "q1", dim: "didactica", text: "El/la docente explica los contenidos con claridad y relaciona teoría con práctica." },
  { id: "q2", dim: "didactica", text: "Las clases fomentan el pensamiento crítico y la participación activa." },
  { id: "q3", dim: "comunicacion", text: "Mantiene un trato respetuoso, escucha y responde a las dudas oportunamente." },
  { id: "q4", dim: "comunicacion", text: "La comunicación (en aula/Moodle/Correo) es clara y oportuna." },
  { id: "q5", dim: "evaluacion", text: "Las evaluaciones se alinean con los resultados de aprendizaje y la rúbrica se comunica previamente." },
  { id: "q6", dim: "evaluacion", text: "Recibo retroalimentación útil para mejorar mi desempeño." },
  { id: "q7", dim: "organizacion", text: "El/la docente organiza adecuadamente el curso (cronograma, materiales y tiempos)." },
  { id: "q8", dim: "organizacion", text: "Usa recursos y tecnologías pertinentes (presentaciones, casos, simulaciones, Moodle)." },
  { id: "q9", dim: "inclusion", text: "Promueve un aula inclusiva y libre de discriminación (género, etnia, discapacidad, etc.)." },
  { id: "q10", dim: "inclusion", text: "Considera ajustes razonables cuando son necesarios." },
  { id: "q11", dim: "etica", text: "Actúa con integridad académica (transparencia, conflictos de interés, uso ético de IA)." },
  { id: "q12", dim: "etica", text: "Vincula la asignatura con problemas reales y responsabilidad social universitaria." },
];

const DEFAULT_PROFES = [
  "Gustavo Hermosa","Nathalia Simbaña","Carolina Rodríguez",
  "Daniel Bermeo","Milhenna Aguilar","Wilson Fustillos","Otro/a (especificar)",
];
const DEFAULT_COURSES = [
  "ADM-PUB-01","ADM-PUB-02","ADM-PUB-03","ADM-PUB-04","ADM-PUB-05",
  "ADM-PUBD-01","ADM-PUBD-02","ADM-PUBD-03","ADM-PUBD-04","ADM-PUBD-05","Otro (especificar)",
];

const LIKERT = [
  { value: 5, label: "5 Totalmente de acuerdo" },
  { value: 4, label: "4 De acuerdo" },
  { value: 3, label: "3 Ni de acuerdo ni en desacuerdo" },
  { value: 2, label: "2 En desacuerdo" },
  { value: 1, label: "1 Totalmente en desacuerdo" },
  { value: null, label: "N/A No aplica" },
];

function Pill({ children }) {
  return <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">{children}</span>;
}
function Section({ title, children, right }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}
function LikertRow({ idx, q, value, onChange }) {
  return (
    <div className="mb-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50">
      <div className="mb-2 font-medium">{idx}. {q.text}</div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {LIKERT.map(opt => (
          <label key={String(opt.label)} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${value===opt.value? 'border-gray-800 bg-gray-100' : 'border-gray-200'}`}>
            <input type="radio" className="h-4 w-4" name={q.id} value={opt.value ?? ''} checked={value === opt.value} onChange={() => onChange(opt.value)} />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500">Dimensión: {DIMENSIONS.find(d=>d.id===q.dim)?.name}</div>
    </div>
  );
}
function StatBar({ label, value }) {
  const pct = Math.max(0, Math.min(100, (value ?? 0) * 20)); // 5 -> 100%
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-semibold">{value ? value.toFixed(2) : '–'}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
        <div className="h-2 rounded-full bg-gray-800" style={{ width: pct + '%'}} />
      </div>
    </div>
  );
}

function AuthGate({ onReady }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [magicSent, setMagicSent] = useState(false);
  const ALLOWED_DOMAIN = "uce.edu.ec";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session) onReady?.(data.session); // ← avisar a App con la sesión
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      if (sess) onReady?.(sess); // ← avisar a App cuando inicia sesión
    });
    return () => sub.subscription.unsubscribe();
  }, [onReady]);

  async function signInWithEmail(e) {
    e.preventDefault();
    if (!email.endsWith("@" + ALLOWED_DOMAIN)) {
      alert("Usa tu correo institucional @" + ALLOWED_DOMAIN);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setLoading(false);
    if (error) alert(error.message);
    else setMagicSent(true);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  if (loading) return <div className="p-6 text-sm text-gray-600">Verificando sesión…</div>;
  if (session) return (
    <div className="mb-4 flex items-center justify-between rounded-xl border bg-white p-3">
      <div className="text-sm text-gray-600">Conectado como <b>{session.user.email}</b></div>
      <button onClick={signOut} className="rounded-lg border px-3 py-1 text-sm">Salir</button>
    </div>
  );
  return (
    <form onSubmit={signInWithEmail} className="mb-4 rounded-xl border bg-white p-4">
      <div className="mb-2 text-sm font-medium">Accede con tu correo institucional</div>
      <div className="flex gap-2">
        <input type="email" required placeholder="tuusuario@uce.edu.ec" value={email} onChange={e=>setEmail(e.target.value)} className="w-full rounded-lg border p-2" />
        <button className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white">{magicSent? "Revisa tu correo" : "Enviar enlace"}</button>
      </div>
      <div className="mt-2 text-xs text-gray-500">Se enviará un enlace mágico; abre desde este mismo dispositivo.</div>
    </form>
  );
}

export default function App() {
  const [tab, setTab] = useState("responder");
  const [profes, setProfes] = useState(DEFAULT_PROFES);
  const [cursos, setCursos] = useState(["Todos", ...DEFAULT_COURSES]);
  const [profesor, setProfesor] = useState("");
  const [curso, setCurso] = useState("");
  const [modalidad, setModalidad] = useState("Presencial");
  const [answers, setAnswers] = useState({});
  const [commentBest, setCommentBest] = useState("");
  const [commentImprove, setCommentImprove] = useState("");
  const [subs, setSubs] = useState([]);
  const [stats, setStats] = useState({ count: 0, overall: null, perQ: {}, perDim: {} });

  // 👇 nuevo: control de visibilidad para admins
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  function average(...nums) {
    const vals = nums.filter(n => typeof n === 'number');
    if (!vals.length) return null;
    return Number((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2));
  }

  async function fetchStats() {
    try {
      const { data, error } = await supabase.from('evaluaciones_view').select('*');
      if (!error && data) {
        const total = data.reduce((a,b)=>a + (b.count || 0), 0);
        setStats(s => ({ ...s, count: total }));
      }
    } catch {}
  }

  // ⬇️ se ejecuta cuando AuthGate confirma sesión
  function handleAuthReady(sess) {
    const email = sess?.user?.email || "";
    const admin = ADMIN_EMAILS.includes(email);
    setIsAdmin(admin);
    if (admin) fetchStats(); // solo cargar stats a admins
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) { alert("Inicia sesión con tu correo institucional."); return; }
    if (!profesor || !curso) { alert("Selecciona docente y curso."); return; }

    const row = {
      user_id: user.id,
      profesor,
      curso,
      modalidad,
      q1: answers.q1 ?? null, q2: answers.q2 ?? null, q3: answers.q3 ?? null, q4: answers.q4 ?? null,
      q5: answers.q5 ?? null, q6: answers.q6 ?? null, q7: answers.q7 ?? null, q8: answers.q8 ?? null,
      q9: answers.q9 ?? null, q10: answers.q10 ?? null, q11: answers.q11 ?? null, q12: answers.q12 ?? null,
      comment_best: commentBest.trim(),
      comment_improve: commentImprove.trim(),
    };

    const { error } = await supabase.from('evaluaciones').insert(row);
    if (error) { alert(error.message); return; }

    setAnswers({}); setCommentBest(""); setCommentImprove("");
    setTab("resultados");
    fetchStats();
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Evaluación Docente – FCA</h1>
        <p className="text-sm text-gray-600">Autenticación obligatoria con correo institucional. Datos guardados en Supabase (free tier).</p>
      </header>

      {/* ahora pasamos la sesión al manejador */}
      <AuthGate onReady={handleAuthReady} />

      <div className="mb-4 flex gap-2">
        <button onClick={()=>setTab("responder")} className={`rounded-full px-4 py-2 text-sm ${tab==='responder'?'bg-gray-900 text-white':'bg-gray-100'}`}>Responder</button>
        {/* 👇 Mostrar "Resultados" solo a admins */}
        {isAdmin && (
          <button onClick={()=>setTab("resultados")} className={`rounded-full px-4 py-2 text-sm ${tab==='resultados'?'bg-gray-900 text-white':'bg-gray-100'}`}>Resultados</button>
        )}
      </div>

      {tab === 'responder' && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Section title="Datos básicos (anónimo para la clase, autenticado para evitar duplicados)">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Docente</label>
                <select value={profesor} onChange={e=>setProfesor(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2">
                  <option value="">Selecciona…</option>
                  {DEFAULT_PROFES.map(p=> <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Curso</label>
                <select value={curso} onChange={e=>setCurso(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2">
                  <option value="">Selecciona…</option>
                  {DEFAULT_COURSES.map(c=> <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Modalidad</label>
                <select value={modalidad} onChange={e=>setModalidad(e.target.value)} className="w-full rounded-lg border border-gray-300 p-2">
                  <option>Presencial</option>
                  <option>Distancia</option>
                  <option>Híbrida</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
              <Pill>Autenticado: @uce.
