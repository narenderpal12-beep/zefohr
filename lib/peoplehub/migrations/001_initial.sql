BEGIN;
CREATE TABLE IF NOT EXISTS organisations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text UNIQUE NOT NULL,
 industry text NOT NULL, size_band text NOT NULL, country text NOT NULL DEFAULT 'IN',
 gst_number text, phone text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organisation_id uuid REFERENCES organisations(id),
 name text NOT NULL, email text NOT NULL, password_hash text NOT NULL,
 role text NOT NULL CHECK (role IN ('super_admin','org_admin','hr_manager','employee')),
 is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users(lower(email));
CREATE TABLE IF NOT EXISTS subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organisation_id uuid UNIQUE NOT NULL REFERENCES organisations(id),
 plan_key text NOT NULL, billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','annual')),
 status text NOT NULL CHECK (status IN ('trial','pending_payment','active','past_due','cancelled','expired')),
 employee_count integer NOT NULL CHECK(employee_count > 0),
 trial_started_at timestamptz, trial_ends_at timestamptz, current_period_end timestamptz,
 payment_provider text, payment_ref text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS modules (key text PRIMARY KEY,name text NOT NULL,description text NOT NULL,priority text,sort_order integer NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS organisation_modules (
 organisation_id uuid NOT NULL REFERENCES organisations(id), module_key text NOT NULL REFERENCES modules(key),
 enabled boolean NOT NULL DEFAULT false, PRIMARY KEY(organisation_id,module_key)
);
CREATE TABLE IF NOT EXISTS site_content (
 key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS site_content_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key text NOT NULL, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), updated_by uuid REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS pages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),slug text UNIQUE NOT NULL,title text NOT NULL,content jsonb NOT NULL DEFAULT '{}',
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS posts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),slug text UNIQUE NOT NULL,title text NOT NULL,excerpt text NOT NULL DEFAULT '',body_md text NOT NULL DEFAULT '',
 cover_image_url text NOT NULL DEFAULT '',cover_image_alt text NOT NULL DEFAULT '',author text NOT NULL DEFAULT '',tags text[] NOT NULL DEFAULT '{}',
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),published_at timestamptz,updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS leads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,email text NOT NULL,phone text,organisation text,message text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_log (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),actor uuid REFERENCES users(id),action text NOT NULL,entity text NOT NULL,
 before jsonb,after jsonb,at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS seo_settings (
 id integer PRIMARY KEY DEFAULT 1 CHECK(id=1),site_name text NOT NULL DEFAULT 'PeopleHub',site_url text NOT NULL DEFAULT '',
 default_title_template text NOT NULL DEFAULT '%page% | %site%',default_meta_description text NOT NULL DEFAULT 'Connected HR, payroll and compliance for growing Indian businesses.',
 default_og_image_url text NOT NULL DEFAULT '/og-default.svg',favicon_url text NOT NULL DEFAULT '/favicon.svg',twitter_handle text NOT NULL DEFAULT '',
 organisation_schema jsonb NOT NULL DEFAULT '{}',ga4_id text NOT NULL DEFAULT '',gsc_verification text NOT NULL DEFAULT '',bing_verification text NOT NULL DEFAULT '',
 extra_head_html text NOT NULL DEFAULT '',robots_extra_rules text NOT NULL DEFAULT '',sitemap_enabled boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS seo_pages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),path text UNIQUE NOT NULL,page_type text NOT NULL DEFAULT 'static',
 title text NOT NULL DEFAULT '',meta_description text NOT NULL DEFAULT '',canonical_url text NOT NULL DEFAULT '',robots text NOT NULL DEFAULT 'index,follow',
 og_title text NOT NULL DEFAULT '',og_description text NOT NULL DEFAULT '',og_image_url text NOT NULL DEFAULT '',twitter_card text NOT NULL DEFAULT 'summary_large_image',
 focus_keyword text NOT NULL DEFAULT '',schema_type text NOT NULL DEFAULT 'WebPage',custom_jsonld jsonb,
 include_in_sitemap boolean NOT NULL DEFAULT true,sitemap_priority numeric NOT NULL DEFAULT 0.7,changefreq text NOT NULL DEFAULT 'weekly',
 explicit_index_override boolean NOT NULL DEFAULT false,discovered boolean NOT NULL DEFAULT true,
 updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS seo_page_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),seo_page_id uuid NOT NULL REFERENCES seo_pages(id),value jsonb NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),updated_by uuid REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS redirects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),from_path text UNIQUE NOT NULL,to_path text NOT NULL,
 status_code integer NOT NULL DEFAULT 301 CHECK(status_code IN(301,302)),is_active boolean NOT NULL DEFAULT true,hit_count bigint NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS not_found_log (path text PRIMARY KEY,count bigint NOT NULL DEFAULT 1,last_seen timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS org_modules_tenant ON organisation_modules(organisation_id);
CREATE INDEX IF NOT EXISTS content_history_key ON site_content_history(key,updated_at DESC);
CREATE INDEX IF NOT EXISTS seo_history_page ON seo_page_history(seo_page_id,updated_at DESC);
COMMIT;
