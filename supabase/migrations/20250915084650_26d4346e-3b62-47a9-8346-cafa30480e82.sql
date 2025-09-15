-- Fix remaining database security issues

-- 1. Move extensions from public schema to extensions schema
-- First check what extensions exist in public
DO $$
DECLARE
    ext_name text;
BEGIN
    -- Move common extensions to extensions schema if they exist in public
    FOR ext_name IN 
        SELECT extname FROM pg_extension 
        WHERE extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        BEGIN
            EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_name);
        EXCEPTION
            WHEN OTHERS THEN
                -- If extensions schema doesn't exist, create it
                CREATE SCHEMA IF NOT EXISTS extensions;
                EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_name);
        END;
    END LOOP;
END
$$;

-- 2. Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- 3. Update extensions to latest versions where possible
-- Note: Some extensions may require manual intervention or specific versions
-- This will attempt to update to the latest available version

DO $$
DECLARE
    ext_record RECORD;
BEGIN
    -- Get all extensions that are not at the latest version
    FOR ext_record IN 
        SELECT e.extname, e.extversion,
               (SELECT version FROM pg_available_extension_versions 
                WHERE name = e.extname AND installed ORDER BY version DESC LIMIT 1) as latest_version
        FROM pg_extension e
        WHERE e.extversion != (
            SELECT version FROM pg_available_extension_versions 
            WHERE name = e.extname AND installed ORDER BY version DESC LIMIT 1
        )
    LOOP
        BEGIN
            EXECUTE format('ALTER EXTENSION %I UPDATE TO %L', ext_record.extname, ext_record.latest_version);
            RAISE NOTICE 'Updated extension % from % to %', ext_record.extname, ext_record.extversion, ext_record.latest_version;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not update extension %: %', ext_record.extname, SQLERRM;
        END;
    END LOOP;
END
$$;