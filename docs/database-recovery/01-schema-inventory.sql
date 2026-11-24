-- SUPER PHONE: read-only schema/configuration inventory.
-- Run in Supabase SQL Editor on the intended project. Does not modify data.
with
tables as (
 select jsonb_agg(jsonb_build_object(
  'schema',n.nspname,'table',c.relname,'rls_enabled',c.relrowsecurity,'force_rls',c.relforcerowsecurity,
  'columns',(select jsonb_agg(jsonb_build_object('name',a.attname,'type',format_type(a.atttypid,a.atttypmod),'not_null',a.attnotnull,'default',pg_get_expr(d.adbin,d.adrelid),'identity',a.attidentity,'generated',a.attgenerated) order by a.attnum)
    from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
    where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped)
 ) order by n.nspname,c.relname) v
 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname in ('public','private') and c.relkind in ('r','p')
),
constraints as (
 select jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'name',con.conname,'type',con.contype,
 'definition',pg_get_constraintdef(con.oid,true),'validated',con.convalidated) order by n.nspname,c.relname,con.conname) v
 from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace
 where n.nspname in ('public','private')
),
indexes as (
 select jsonb_agg(jsonb_build_object('schema',n.nspname,'table',t.relname,'index',i.relname,'definition',pg_get_indexdef(x.indexrelid)) order by n.nspname,t.relname,i.relname) v
 from pg_index x join pg_class t on t.oid=x.indrelid join pg_class i on i.oid=x.indexrelid join pg_namespace n on n.oid=t.relnamespace
 where n.nspname in ('public','private')
),
policies as (
 select jsonb_agg(jsonb_build_object('schema',schemaname,'table',tablename,'name',policyname,'command',cmd,'roles',roles,'using',qual,'with_check',with_check) order by schemaname,tablename,policyname) v
 from pg_policies where schemaname in ('public','private')
),
triggers as (
 select jsonb_agg(jsonb_build_object('schema',trigger_schema,'table',event_object_table,'name',trigger_name,'event',event_manipulation,'action',action_statement) order by trigger_schema,event_object_table,trigger_name,event_manipulation) v
 from information_schema.triggers where trigger_schema in ('public','private')
),
routines as (
 select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'identity_args',pg_get_function_identity_arguments(p.oid),'definition',pg_get_functiondef(p.oid)) order by n.nspname,p.proname) v
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private')
),
enums as (
 select jsonb_agg(jsonb_build_object('schema',n.nspname,'type',t.typname,'values',
  (select jsonb_agg(e.enumlabel order by e.enumsortorder) from pg_enum e where e.enumtypid=t.oid)
 ) order by n.nspname,t.typname) v
 from pg_type t join pg_namespace n on n.oid=t.typnamespace where t.typtype='e' and n.nspname in ('public','private')
),
buckets as (
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',name,'public',public,'file_size_limit',file_size_limit,'allowed_mime_types',allowed_mime_types) order by id),'[]'::jsonb) v
 from storage.buckets
)
select jsonb_pretty(jsonb_build_object(
 'captured_at',now(),'tables',tables.v,'constraints',constraints.v,'indexes',indexes.v,
 'policies',policies.v,'triggers',triggers.v,'routines',routines.v,'enums',enums.v,'storage_buckets',buckets.v
)) as schema_inventory
from tables,constraints,indexes,policies,triggers,routines,enums,buckets;
