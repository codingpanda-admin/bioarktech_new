-- SQL dump for selected bioone public tables
-- Generated at 2026-06-19T15:53:40.200Z
-- Tables: public.users

BEGIN;

SET session_replication_role = replica;

-- ============================================================
-- public.users
-- ============================================================
DROP TABLE IF EXISTS public."users" CASCADE;
CREATE TABLE IF NOT EXISTS public."users" (
    "id" bigint NOT NULL,
    "password" character varying(128) NOT NULL,
    "last_login" timestamp with time zone,
    "is_superuser" boolean NOT NULL,
    "first_name" character varying(150) NOT NULL,
    "last_name" character varying(150) NOT NULL,
    "email" character varying(255) NOT NULL,
    "is_staff" boolean NOT NULL,
    "is_active" boolean NOT NULL,
    "date_joined" timestamp with time zone NOT NULL,
    "title" character varying,
    "mobile" character varying,
    "telephone" character varying,
    "company" character varying,
    "job_title" character varying,
    "address_id" bigint,
    "billing_address_id" bigint,
    "shipping_address_id" bigint,
    "has_set_password" boolean NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    CONSTRAINT "users_email_0ea73cca_uniq" UNIQUE (email),
    CONSTRAINT "users_pkey" PRIMARY KEY (id),
    CONSTRAINT "users_address_id_96e92564_fk_users_address_id" FOREIGN KEY (address_id) REFERENCES addresses(id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT "users_billing_address_id_53318b60_fk_users_address_id" FOREIGN KEY (billing_address_id) REFERENCES addresses(id) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT "users_shipping_address_id_008c2dab_fk_users_address_id" FOREIGN KEY (shipping_address_id) REFERENCES addresses(id) DEFERRABLE INITIALLY DEFERRED
);

INSERT INTO public."users" ("id", "password", "last_login", "is_superuser", "first_name", "last_name", "email", "is_staff", "is_active", "date_joined", "title", "mobile", "telephone", "company", "job_title", "address_id", "billing_address_id", "shipping_address_id", "has_set_password", "is_admin") VALUES
    ('17', 'pbkdf2_sha256$720000$TpYRwXVGBAybWP7GzxsJ2V$hseee7Ji99oJAnM0VQZWaTJ9e4UirEfBIFB1YXYR1os=', NULL, FALSE, 'Charles', 'Thompson', 'thompsonc4@nih.gov', FALSE, TRUE, '2025-08-28T16:39:16.842Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE),
    ('2', 'pbkdf2_sha256$720000$LVX0RcezwAqYsfA1w2iY7u$zlmACaN6oykhIhV68Uzij3K3vyk9kPE7baCidMaXhQ8=', '2025-08-28T16:43:26.113Z', FALSE, 'Lipeng', 'Wu', 'lipengwu@bioarktech.com', TRUE, TRUE, '2025-04-06T01:30:35.000Z', 'Mr', '734-604-2386', '734-604-2386', 'BioArk Technologies', 'Founder', '2', '2', '3', FALSE, FALSE),
    ('12', 'pbkdf2_sha256$720000$8nBhV1lxbThhF4pklOqw73$FCOwp7bB0MQc44zJHueE8yIDoyKF4lfescD11gTMcu8=', '2025-05-31T19:35:43.000Z', FALSE, '', '', 'b@gmail.com', TRUE, TRUE, '2025-05-31T19:35:29.000Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE),
    ('18', 'pbkdf2_sha256$720000$UhDI69e7ZVR6XnAu0vCziL$MZD6Kq693diqvOQ9A5JFngM+NxL4GEbmJALHs9Fv6jU=', NULL, FALSE, 'Tijuana', 'Leftwich', 'silverst@nih.gov', FALSE, TRUE, '2025-08-29T21:05:25.422Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE),
    ('13', 'pbkdf2_sha256$720000$x83pbyBDbmyAmRNQOxx8d2$2TUIqa9vozK/gk4BEQnZsd2V+O0s6ux6HdV0UGkdlUM=', '2025-05-31T19:38:26.543Z', FALSE, '', '', 'brandon@gmail.com', FALSE, TRUE, '2025-05-31T19:38:11.546Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE),
    ('14', 'pbkdf2_sha256$720000$uQHw7DGXlu8XA3csYjYiq4$Cu11XFd+vai7AjmXLNiGnlSVjbeaz8BHBKakx5gZy8U=', NULL, FALSE, 'Marisa', 'Sears', 'marisa_sears@unc.edu', FALSE, TRUE, '2025-08-08T15:19:32.316Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE),
    ('1', 'pbkdf2_sha256$720000$UEJEFTpcbe9kTLaXRgiyQ2$983779Rr2U1oyhY0s7XdetwWH7clkd3ccss8CE0hxfE=', '2025-12-18T19:21:10.874Z', TRUE, 'Brandon', 'Zhu', 'brandonzhu123@gmail.com', TRUE, TRUE, '2025-03-31T20:18:12.931Z', '', '', '', '', '', NULL, NULL, '1', FALSE, FALSE),
    ('11', 'pbkdf2_sha256$720000$DRahONfhJ4efaVYAYr1Ybh$iG14hPs4MC3h2d5Esu+T7SpzBf71upzx60IIuviQpw4=', NULL, FALSE, 'min', 'Li', 'lmin@niddk.nih.gov', FALSE, TRUE, '2025-05-28T22:50:17.346Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE),
    ('9', 'pbkdf2_sha256$720000$rgSUwlhBfHWuYrZaMwQ0bz$MkGZP/4lSKiGrya4kl2LBWT9u/iCtdC/e0bJ9Jnfflc=', '2025-04-17T13:23:17.894Z', FALSE, '', '', 'yangs@nhlbi.nih.gov', FALSE, TRUE, '2025-04-17T00:13:16.655Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE),
    ('15', 'pbkdf2_sha256$720000$2i0Mm3G8MplEfwZlhCCeWy$+mi0bUxOxMpj9V09n7CG71Q0C7kBjRa1sSKhVHD6ot8=', NULL, FALSE, 'Yukun', 'Guan', 'cmaire@mail.nih.gov', FALSE, TRUE, '2025-08-12T15:00:46.148Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE),
    ('16', 'pbkdf2_sha256$720000$UII9T9fOyISOsHfVvuURJM$AOcTJduJrMEDuijruYQfq7u0+GeR56D+cC+N3NBMrtQ=', NULL, FALSE, 'Jason', 'Piotrowski', 'jason.piotrowski@nih.gov', FALSE, TRUE, '2025-08-13T14:31:28.759Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE),
    ('19', 'pbkdf2_sha256$720000$PBhqxpQ44iih6KKmI2cVF8$dZFLaHlNrRjjHsTQuTYjiFdMikFgQ2lMjJx7Z4fmIfc=', '2026-06-17T01:27:51.678Z', FALSE, 'Coding', 'Panda', 'conding.panda@gmail.com', FALSE, TRUE, '2026-06-17T01:27:49.287Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE),
    ('20', 'pbkdf2_sha256$720000$AkIIo7wXKZavVB6IVjuVaS$WzqDfKFGz5p0Fi2O1Qv7E9FHjaDKthtgPnleXZRIqW4=', '2026-06-19T15:28:11.923Z', FALSE, 'Brian', 'Zhong', 'kbzhong@gmail.com', FALSE, TRUE, '2026-06-19T15:06:00.502Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, FALSE, FALSE);

CREATE INDEX users_address_id_96e92564 ON public.users USING btree (address_id);
CREATE INDEX users_billing_address_id_53318b60 ON public.users USING btree (billing_address_id);
CREATE INDEX users_email_0ea73cca_like ON public.users USING btree (email varchar_pattern_ops);
CREATE INDEX users_shipping_address_id_008c2dab ON public.users USING btree (shipping_address_id);
SELECT setval(pg_get_serial_sequence('public.users', 'id'), COALESCE((SELECT MAX("id") FROM public."users"), 1), true);

SET session_replication_role = DEFAULT;

COMMIT;
