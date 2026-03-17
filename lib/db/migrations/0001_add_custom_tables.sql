CREATE TABLE IF NOT EXISTS clients (
	id serial PRIMARY KEY,
	user_id integer NOT NULL,
	name varchar(100) NOT NULL,
	email varchar(255),
	phone varchar(50),
	company varchar(100),
	address text,
	website varchar(255),
	notes text,
	created_at timestamp NOT NULL DEFAULT now(),
	updated_at timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS projects (
	id serial PRIMARY KEY,
	user_id integer NOT NULL,
	client_id integer NOT NULL,
	name varchar(100) NOT NULL,
	description text,
	status varchar(50) NOT NULL DEFAULT 'active',
	start_date timestamp,
	end_date timestamp,
	budget numeric(10, 2),
	created_at timestamp NOT NULL DEFAULT now(),
	updated_at timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS proposals (
	id serial PRIMARY KEY,
	user_id integer NOT NULL,
	client_id integer NOT NULL,
	project_id integer,
	title varchar(100) NOT NULL,
	description text,
	status varchar(50) NOT NULL DEFAULT 'draft',
	valid_until timestamp,
	total_amount numeric(10, 2),
	sent_at timestamp,
	viewed_at timestamp,
	accepted_at timestamp,
	rejected_at timestamp,
	created_at timestamp NOT NULL DEFAULT now(),
	updated_at timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS proposal_line_items (
	id serial PRIMARY KEY,
	user_id integer NOT NULL,
	proposal_id integer NOT NULL,
	title varchar(100) NOT NULL,
	description text,
	quantity numeric(8, 2) NOT NULL DEFAULT '1',
	rate numeric(10, 2) NOT NULL,
	amount numeric(10, 2) NOT NULL,
	"order" integer NOT NULL DEFAULT 0,
	created_at timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS invoices (
	id serial PRIMARY KEY,
	user_id integer NOT NULL,
	client_id integer NOT NULL,
	project_id integer,
	proposal_id integer,
	invoice_number varchar(50) NOT NULL,
	title varchar(100) NOT NULL,
	description text,
	status varchar(50) NOT NULL DEFAULT 'draft',
	subtotal numeric(10, 2) NOT NULL,
	tax_rate numeric(5, 4),
	tax_amount numeric(10, 2),
	total_amount numeric(10, 2) NOT NULL,
	due_date timestamp,
	sent_at timestamp,
	paid_at timestamp,
	created_at timestamp NOT NULL DEFAULT now(),
	updated_at timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS invoice_line_items (
	id serial PRIMARY KEY,
	user_id integer NOT NULL,
	invoice_id integer NOT NULL,
	title varchar(100) NOT NULL,
	description text,
	quantity numeric(8, 2) NOT NULL DEFAULT '1',
	rate numeric(10, 2) NOT NULL,
	amount numeric(10, 2) NOT NULL,
	"order" integer NOT NULL DEFAULT 0,
	created_at timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS project_files (
	id serial PRIMARY KEY,
	user_id integer NOT NULL,
	project_id integer NOT NULL,
	filename varchar(255) NOT NULL,
	original_name varchar(255) NOT NULL,
	mime_type varchar(100),
	file_size integer,
	file_path text NOT NULL,
	description text,
	uploaded_at timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS agency_branding (
	id serial PRIMARY KEY,
	user_id integer NOT NULL,
	agency_name varchar(100),
	primary_color varchar(7),
	secondary_color varchar(7),
	logo_url text,
	favicon_url text,
	custom_domain varchar(255),
	is_active boolean NOT NULL DEFAULT false,
	created_at timestamp NOT NULL DEFAULT now(),
	updated_at timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE clients ADD CONSTRAINT clients_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE projects ADD CONSTRAINT projects_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE projects ADD CONSTRAINT projects_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES clients(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE proposals ADD CONSTRAINT proposals_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE proposals ADD CONSTRAINT proposals_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES clients(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE proposals ADD CONSTRAINT proposals_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES projects(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE proposal_line_items ADD CONSTRAINT proposal_line_items_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE proposal_line_items ADD CONSTRAINT proposal_line_items_proposal_id_proposals_id_fk FOREIGN KEY (proposal_id) REFERENCES proposals(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE invoices ADD CONSTRAINT invoices_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE invoices ADD CONSTRAINT invoices_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES clients(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE invoices ADD CONSTRAINT invoices_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES projects(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE invoices ADD CONSTRAINT invoices_proposal_id_proposals_id_fk FOREIGN KEY (proposal_id) REFERENCES proposals(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE invoice_line_items ADD CONSTRAINT invoice_line_items_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE invoice_line_items ADD CONSTRAINT invoice_line_items_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES invoices(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE project_files ADD CONSTRAINT project_files_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE project_files ADD CONSTRAINT project_files_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES projects(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE agency_branding ADD CONSTRAINT agency_branding_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES users(id);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;