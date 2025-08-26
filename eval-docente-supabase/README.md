# Evaluación Docente – Supabase + Auth (Gratis)

## 0) Variables de entorno (Vercel)
- `VITE_SUPABASE_URL` = URL del proyecto
- `VITE_SUPABASE_ANON_KEY` = Anon key

## 1) SQL en Supabase
```sql
-- Tabla principal
create table if not exists public.evaluaciones (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profesor text not null,
  curso text not null,
  modalidad text not null,
  q1 smallint, q2 smallint, q3 smallint, q4 smallint,
  q5 smallint, q6 smallint, q7 smallint, q8 smallint,
  q9 smallint, q10 smallint, q11 smallint, q12 smallint,
  comment_best text, comment_improve text,
  constraint uq_once unique (user_id, profesor, curso)
);

alter table public.evaluaciones enable row level security;

-- Solo inserta si es autenticado y su email es @uce.edu.ec
create policy insert_uce_only on public.evaluaciones
for insert to authenticated
with check (auth.email() like '%@uce.edu.ec');

-- Por defecto, nadie puede seleccionar la tabla base.
revoke all on table public.evaluaciones from anon, authenticated;

-- Vista agregada pública para usuarios autenticados (sin comentarios)
create or replace view public.evaluaciones_view as
select
  profesor, curso, modalidad,
  count(*)::int as count,
  round(avg((coalesce(q1,0)+coalesce(q2,0)+coalesce(q3,0)+coalesce(q4,0)
            +coalesce(q5,0)+coalesce(q6,0)+coalesce(q7,0)+coalesce(q8,0)
            +coalesce(q9,0)+coalesce(q10,0)+coalesce(q11,0)+coalesce(q12,0)) / nullif(
            (case when q1 is not null then 1 else 0 end)+
            (case when q2 is not null then 1 else 0 end)+
            (case when q3 is not null then 1 else 0 end)+
            (case when q4 is not null then 1 else 0 end)+
            (case when q5 is not null then 1 else 0 end)+
            (case when q6 is not null then 1 else 0 end)+
            (case when q7 is not null then 1 else 0 end)+
            (case when q8 is not null then 1 else 0 end)+
            (case when q9 is not null then 1 else 0 end)+
            (case when q10 is not null then 1 else 0 end)+
            (case when q11 is not null then 1 else 0 end)+
            (case when q12 is not null then 1 else 0 end),0)
  ),2) as avg_general,
  round(avg((coalesce(q1,0)+coalesce(q2,0)) / nullif((case when q1 is not null then 1 else 0 end)+(case when q2 is not null then 1 else 0 end),0)),2) as didactica_avg,
  round(avg((coalesce(q3,0)+coalesce(q4,0)) / nullif((case when q3 is not null then 1 else 0 end)+(case when q4 is not null then 1 else 0 end),0)),2) as comunicacion_avg,
  round(avg((coalesce(q5,0)+coalesce(q6,0)) / nullif((case when q5 is not null then 1 else 0 end)+(case when q6 is not null then 1 else 0 end),0)),2) as evaluacion_avg,
  round(avg((coalesce(q7,0)+coalesce(q8,0)) / nullif((case when q7 is not null then 1 else 0 end)+(case when q8 is not null then 1 else 0 end),0)),2) as organizacion_avg,
  round(avg((coalesce(q9,0)+coalesce(q10,0)) / nullif((case when q9 is not null then 1 else 0 end)+(case when q10 is not null then 1 else 0 end),0)),2) as inclusion_avg,
  round(avg((coalesce(q11,0)+coalesce(q12,0)) / nullif((case when q11 is not null then 1 else 0 end)+(case when q12 is not null then 1 else 0 end),0)),2) as etica_avg
from public.evaluaciones
group by profesor, curso, modalidad;

grant select on public.evaluaciones_view to authenticated;
```

## 2) .env en Vercel
- Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY

## 3) Despliegue
- `npm install` → `npm run build` → Vercel (framework Vite, output dist/)

## 4) Notas
- Duplicados: la `unique (user_id, profesor, curso)` evita más de 1 envío por usuario/curso/docente.
- Privacidad: los comentarios sólo están en la tabla base; la vista agregada no los expone.
- Tablero: conecta Looker Studio a un CSV exportado desde la vista o usa Supabase → export.
