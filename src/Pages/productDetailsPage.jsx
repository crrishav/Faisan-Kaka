import React, { useState, useEffect, useMemo } from 'react';
import ProductDetails from '../Components/productDetails.jsx';
import Footer from '../Components/footer.jsx';
import SmoothScroll from '../Components/smoothScroll.jsx';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductBySlug } from '../lib/sanityClient.js';

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch product from Sanity
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getProductBySlug(slug);
        if (data) {
          setProduct(data);
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  // Scroll to top on mount
  useEffect(() => {
    if (window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [slug]);

  // Transform Sanity data for ProductDetails component
  const productData = useMemo(() => {
    if (!product) return null;

    const mainImageUrl = product.mainImage?.asset?.url;
    const additionalImages = product.images?.map(img => img.asset?.url).filter(Boolean) || [];
    
    // Use main image as front, first additional image as back (or same if no additional)
    const frontImage = mainImageUrl;
    const backImage = additionalImages[0] || mainImageUrl;

    // Default description if not provided
    const defaultDescription = `${product.title} is crafted with premium materials and designed for everyday comfort, durability, and clean style.`;

    return {
      title: product.title,
      priceINR: product.priceINR?.toString() || '0',
      priceNPR: product.priceNPR?.toString() || '0',
      description: product.description || defaultDescription,
      colors: product.colors?.map(c => c.hex || c.color) || ["#3D5443", "#4D3434", "#4A4A4A"],
      sizes: product.sizes || ["M", "L", "S"],
      slug: product.slug?.current || slug,
      frontImage,
      backImage,
      images: [frontImage, backImage, ...additionalImages.slice(1)].filter(Boolean),
      category: product.category,
      inStock: product.inStock,
    };
  }, [product, slug]);


  // Error state
  if (error || !productData) {
    return (
      <SmoothScroll>
        <div className="min-h-screen flex flex-col bg-[#f5f5f5] overflow-x-hidden">
          <div className="flex-1 flex items-center justify-center pt-20 px-4">
            <div className="text-center max-w-md">
              <p className="text-red-500 font-medium mb-4">{error || 'Product not found'}</p>
              <button 
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-black text-white rounded-full font-bold hover:opacity-80 transition-opacity"
              >
                Back to Shop
              </button>
            </div>
          </div>
          <Footer />
        </div>
      </SmoothScroll>
    );
  }

  const backImg = productData.images[1] || productData.images[0];
  const frontImg = productData.images[0];

  return (
    <SmoothScroll>
      <div className="min-h-screen flex flex-col bg-[#f5f5f5] overflow-x-hidden">
        
        {/* Main Content */}
        <div className="flex-1 px-4 sm:px-8 pt-8 md:pt-28 overflow-x-hidden flex items-center justify-center">
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center md:flex-row md:items-start gap-8 md:h-screen pt-12">
            {/* Desktop Images - Side by Side */}
            <div className="hidden md:grid w-full md:w-[600px] grid-cols-1 md:grid-cols-2 gap-8">
              <div className="rounded-[35px] overflow-hidden shadow-xl bg-[#1f3c34]">
                <img src={backImg} alt={productData.title} className="w-full h-64 md:h-[420px] object-cover" />
              </div>
              <div className="rounded-[35px] overflow-hidden shadow-xl bg-[#27443b]">
                <img src={frontImg} alt={productData.title} className="w-full h-64 md:h-[420px] object-cover" />
              </div>
            </div>

            {/* Product Details - Desktop & Mobile */}
            <div className="w-full md:w-[440px] flex-shrink-0">
              <ProductDetails 
                title={productData.title}
                priceINR={productData.priceINR}
                priceNPR={productData.priceNPR}
                description={productData.description}
                colors={productData.colors}
                sizes={productData.sizes}
                slug={productData.slug}
                frontImage={frontImg}
                backImage={backImg}
              />
              
              {/* Stock Status */}
              <div className="mt-4 flex justify-center md:justify-start">
                {productData.inStock !== false ? (
                  <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    In Stock
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </SmoothScroll>
  );
};

export default ProductDetailsPage;
