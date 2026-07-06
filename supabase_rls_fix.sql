-- MMA IQ - Supabase RLS Fix Script
-- Run this script in your Supabase SQL Editor to fix "infinite recursion" errors.

-- 1. Create a secure function to check admin status
-- SECURITY DEFINER allows the function to bypass RLS, preventing recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Create a secure function to check coach status
CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'coach'
  ) OR EXISTS (
    SELECT 1 FROM public.coaches
    WHERE profile_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Fix policies for "profiles"
-- We use DROP POLICY IF EXISTS followed by CREATE POLICY as requested.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can do everything on profiles" ON profiles;
CREATE POLICY "Admins can do everything on profiles" ON profiles
  FOR ALL USING (is_admin());

-- 4. Fix policies for "coaches"
DROP POLICY IF EXISTS "Coaches are viewable by everyone" ON coaches;
CREATE POLICY "Coaches are viewable by everyone" ON coaches
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can do everything on coaches" ON coaches;
CREATE POLICY "Admins can do everything on coaches" ON coaches
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Coaches can update their own data" ON coaches;
CREATE POLICY "Coaches can update their own data" ON coaches
  FOR UPDATE USING (auth.uid() = profile_id OR is_admin());

-- 5. Fix policies for "formations"
DROP POLICY IF EXISTS "Formations viewable by everyone" ON formations;
CREATE POLICY "Formations viewable by everyone" ON formations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins and coaches can manage formations" ON formations;
CREATE POLICY "Admins and coaches can manage formations" ON formations
  FOR ALL USING (is_admin() OR is_coach());

-- 6. Fix policies for "products"
DROP POLICY IF EXISTS "Products viewable by everyone" ON products;
CREATE POLICY "Products viewable by everyone" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (is_admin());

-- 7. Fix policies for "site_content"
DROP POLICY IF EXISTS "Site content viewable by everyone" ON site_content;
CREATE POLICY "Site content viewable by everyone" ON site_content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage site content" ON site_content;
CREATE POLICY "Admins can manage site content" ON site_content
  FOR ALL USING (is_admin());

-- 8. Fix policies for "purchases"
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- 9. Fix policies for "blog_posts"
DROP POLICY IF EXISTS "Blog posts viewable by everyone" ON blog_posts;
CREATE POLICY "Blog posts viewable by everyone" ON blog_posts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage blog posts" ON blog_posts;
CREATE POLICY "Admins can manage blog posts" ON blog_posts
  FOR ALL USING (is_admin());
