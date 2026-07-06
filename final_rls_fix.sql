-- MMA IQ - Final RLS Fix Script
-- This script fixes infinite recursion by using SECURITY DEFINER functions
-- and direct JWT checks for admin status.

-- 1. Create/Update secure functions
-- SECURITY DEFINER bypasses RLS, preventing recursion.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get email from JWT (standard location)
  user_email := auth.jwt() ->> 'email';
  
  -- Fallback to user_metadata if email is missing in top level
  IF (user_email IS NULL) THEN
    user_email := auth.jwt() -> 'user_metadata' ->> 'email';
  END IF;
  
  -- Hardcoded check for the main admin
  IF (user_email = 'stanlamoureux@gmail.com') THEN
    RETURN TRUE;
  END IF;
  
  -- Fallback to checking the profiles table (bypassing RLS)
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update policies to be more explicit for INSERT
DROP POLICY IF EXISTS "Super admin can insert coaches" ON public.coaches;
CREATE POLICY "Super admin can insert coaches" 
ON public.coaches FOR INSERT 
WITH CHECK (check_is_admin());

DROP POLICY IF EXISTS "Admins and coaches can manage formations" ON public.formations;
CREATE POLICY "Formations viewable by everyone" ON public.formations
  FOR SELECT USING (true);
CREATE POLICY "Admins and coaches can manage formations" ON public.formations
  FOR ALL USING (check_is_admin() OR check_is_coach())
  WITH CHECK (check_is_admin() OR check_is_coach());

DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;
CREATE POLICY "Admins can manage blog posts" ON public.blog_posts
  FOR ALL USING (check_is_admin())
  WITH CHECK (check_is_admin());

DROP POLICY IF EXISTS "Admins can manage site content" ON public.site_content;
CREATE POLICY "Admins can manage site content" ON public.site_content
  FOR ALL USING (check_is_admin())
  WITH CHECK (check_is_admin());

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (check_is_admin())
  WITH CHECK (check_is_admin());

CREATE OR REPLACE FUNCTION public.check_is_coach()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check profiles table (bypassing RLS)
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'coach'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fix PROFILES policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL USING (check_is_admin());

-- 3. Fix COACHES policies (Strictly following user instructions)
DROP POLICY IF EXISTS "Allow public read coaches by access_key" ON public.coaches;
DROP POLICY IF EXISTS "Enable insert for super admins" ON public.coaches;
DROP POLICY IF EXISTS "Enable update for coaches and admins" ON public.coaches;
DROP POLICY IF EXISTS "Enable delete for super admins" ON public.coaches;
DROP POLICY IF EXISTS "Public can read coaches" ON public.coaches;
DROP POLICY IF EXISTS "Super admin can insert coaches" ON public.coaches;
DROP POLICY IF EXISTS "Super admin can update coaches" ON public.coaches;
DROP POLICY IF EXISTS "Super admin can delete coaches" ON public.coaches;
DROP POLICY IF EXISTS "Coaches are viewable by everyone" ON public.coaches;
DROP POLICY IF EXISTS "Admins can do everything on coaches" ON public.coaches;
DROP POLICY IF EXISTS "Coaches can update their own data" ON public.coaches;

CREATE POLICY "Public can read coaches" 
ON public.coaches FOR SELECT USING (true);

CREATE POLICY "Super admin can insert coaches" 
ON public.coaches FOR INSERT 
WITH CHECK (check_is_admin());

CREATE POLICY "Super admin can update coaches" 
ON public.coaches FOR UPDATE 
USING (check_is_admin());

CREATE POLICY "Super admin can delete coaches" 
ON public.coaches FOR DELETE 
USING (check_is_admin());

-- 4. Fix FORMATIONS policies
DROP POLICY IF EXISTS "Formations viewable by everyone" ON public.formations;
DROP POLICY IF EXISTS "Admins and coaches can manage formations" ON public.formations;

CREATE POLICY "Formations viewable by everyone" ON public.formations
  FOR SELECT USING (true);

CREATE POLICY "Admins and coaches can manage formations" ON public.formations
  FOR ALL USING (
    check_is_admin() OR 
    check_is_coach()
  );

-- 5. Fix BLOG_POSTS policies
DROP POLICY IF EXISTS "Blog posts viewable by everyone" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;

CREATE POLICY "Blog posts viewable by everyone" ON public.blog_posts
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage blog posts" ON public.blog_posts
  FOR ALL USING (check_is_admin());

-- 6. Fix SITE_CONTENT policies
DROP POLICY IF EXISTS "Site content viewable by everyone" ON public.site_content;
DROP POLICY IF EXISTS "Admins can manage site content" ON public.site_content;

CREATE POLICY "Site content viewable by everyone" ON public.site_content
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage site content" ON public.site_content
  FOR ALL USING (check_is_admin());

-- 7. Fix PRODUCTS policies
DROP POLICY IF EXISTS "Products viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Products viewable by everyone" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (check_is_admin());

-- 8. Fix PURCHASES policies
DROP POLICY IF EXISTS "Users can view own purchases" ON public.purchases;

CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT USING (
    (auth.uid() = user_id) OR 
    check_is_admin()
  );
