"""
Tenant resolution strategy and tenant context.

Tenancy model (choose one before implementing features):

- ROW_LEVEL: Add tenant_id to tenant-scoped tables; single schema; filter all
  queries by tenant_id. Simpler ops, good default for most SaaS.
- SCHEMA_PER_TENANT: One PostgreSQL schema per tenant; set search_path or
  connection per request. Stronger isolation, more migrations and backup complexity.

Implement: resolve tenant from header/subdomain/JWT in middleware or deps,
then set request state and/or DB session (e.g. SET request.tenant_id for
row-level, or SET search_path for schema-per-tenant). See README.
"""
