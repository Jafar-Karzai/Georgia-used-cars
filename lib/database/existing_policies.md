| schemaname | tablename | policyname                                | permissive | roles    | cmd    | qual                                                                                                                                                                                                                       |
| ---------- | --------- | ----------------------------------------- | ---------- | -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public     | expenses  | All authenticated users can view expenses | PERMISSIVE | {public} | SELECT | (auth.role() = 'authenticated'::text)                                                                                                                                                                                      |
| public     | expenses  | Finance managers can manage expenses      | PERMISSIVE | {public} | ALL    | (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super_admin'::user_role, 'manager'::user_role, 'finance_manager'::user_role, 'inventory_manager'::user_role]))))) |


  Policy condition matches for user; 
  | current_user | auth_role | has_permission |
| ------------ | --------- | -------------- |
| null         | null      | false          |