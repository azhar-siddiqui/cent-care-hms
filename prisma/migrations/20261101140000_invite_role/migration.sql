ALTER TABLE "admin_invitations"
  ADD COLUMN "role" "staff_role" NOT NULL DEFAULT 'ADMIN';

CREATE OR REPLACE FUNCTION enforce_admin_invitation_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  admin_count integer;
  pending_count integer;
BEGIN
  IF NEW.status <> 'PENDING' OR NEW.role <> 'ADMIN' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'ADMIN';
  SELECT COUNT(*) INTO pending_count
  FROM admin_invitations
  WHERE status = 'PENDING' AND role = 'ADMIN' AND id <> NEW.id;

  IF admin_count + pending_count >= 3 THEN
    RAISE EXCEPTION 'Additional admin limit reached (maximum 3 admins, including pending invitations)';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_invitations_limit ON admin_invitations;

CREATE TRIGGER admin_invitations_limit
BEFORE INSERT OR UPDATE OF status, role ON admin_invitations
FOR EACH ROW
EXECUTE FUNCTION enforce_admin_invitation_limit();
