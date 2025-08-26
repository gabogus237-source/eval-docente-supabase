import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./index.css";

// 👇 Solo estos correos ven la pestaña "Resultados"
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
      if (data.session) onReady?.(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      if (sess) onReady?.(sess);
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
    <form onSubmit={signInWithEmail} className="mb-4 rounded-xl border bg-white
