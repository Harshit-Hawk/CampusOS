-- Migration 039: Campus Marketplace
-- Student-to-student marketplace for books, electronics, notes, etc.

-- 1. Marketplace Listings
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    category TEXT NOT NULL CHECK (category IN (
        'books', 'electronics', 'notes', 'lab_equipment', 'hostel_essentials', 'other'
    )),
    condition TEXT DEFAULT 'good' CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
    images TEXT[] DEFAULT '{}',
    is_sold BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Marketplace Messages (buyer-seller chat)
CREATE TABLE IF NOT EXISTS public.marketplace_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Seller Ratings
CREATE TABLE IF NOT EXISTS public.seller_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(buyer_id, listing_id)
);

-- Storage bucket for marketplace images
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace', 'marketplace', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Marketplace images are publicly accessible"
    ON storage.objects FOR SELECT USING (bucket_id = 'marketplace');
CREATE POLICY "Authenticated users can upload marketplace images"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'marketplace' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "Users can delete own marketplace images"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'marketplace' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- Indexes
CREATE INDEX idx_marketplace_listings_seller ON public.marketplace_listings(seller_id);
CREATE INDEX idx_marketplace_listings_category ON public.marketplace_listings(category);
CREATE INDEX idx_marketplace_listings_active ON public.marketplace_listings(is_active, is_sold);
CREATE INDEX idx_marketplace_listings_price ON public.marketplace_listings(price);
CREATE INDEX idx_marketplace_msgs_listing ON public.marketplace_messages(listing_id);
CREATE INDEX idx_marketplace_msgs_sender ON public.marketplace_messages(sender_id);
CREATE INDEX idx_marketplace_msgs_receiver ON public.marketplace_messages(receiver_id);
CREATE INDEX idx_seller_ratings_seller ON public.seller_ratings(seller_id);

-- RLS
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_ratings ENABLE ROW LEVEL SECURITY;

-- Marketplace Listings Policies
CREATE POLICY "Anyone can view active listings"
    ON public.marketplace_listings FOR SELECT USING (
        (is_active = true AND is_sold = false) OR seller_id = auth.uid() OR public.has_role('admin')
    );
CREATE POLICY "Authenticated users can create listings"
    ON public.marketplace_listings FOR INSERT TO authenticated
    WITH CHECK (seller_id = auth.uid());
CREATE POLICY "Sellers can update own listings"
    ON public.marketplace_listings FOR UPDATE USING (seller_id = auth.uid() OR public.has_role('admin'));
CREATE POLICY "Sellers can delete own listings"
    ON public.marketplace_listings FOR DELETE USING (seller_id = auth.uid() OR public.has_role('admin'));

-- Messages Policies
CREATE POLICY "Participants can view messages"
    ON public.marketplace_messages FOR SELECT USING (
        sender_id = auth.uid() OR receiver_id = auth.uid()
    );
CREATE POLICY "Authenticated can send messages"
    ON public.marketplace_messages FOR INSERT TO authenticated
    WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Receivers can mark as read"
    ON public.marketplace_messages FOR UPDATE USING (receiver_id = auth.uid());

-- Ratings Policies
CREATE POLICY "Anyone can view ratings"
    ON public.seller_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated can rate sellers"
    ON public.seller_ratings FOR INSERT TO authenticated
    WITH CHECK (buyer_id = auth.uid() AND buyer_id != seller_id);
