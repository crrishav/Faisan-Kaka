import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import './ReviewSection.css';

/* ─── Review data ──────────────────────────────────────────────── */

const REVIEWS = [
  {
    id: 1,
    name: 'Arjun M.',
    location: 'Mumbai, MH',
    rating: 5,
    quote: 'Quality is genuinely insane for the price. The hoodie feels premium, the print has not faded after 10+ washes.',
    initials: 'AM',
    avatarColor: '#1e3a8a',
  },
  {
    id: 2,
    name: 'Priya S.',
    location: 'Bengaluru, KA',
    rating: 5,
    quote: 'Ordered a custom print for my team and every piece came out sharp and exactly as submitted. Super fast delivery too.',
    initials: 'PS',
    avatarColor: '#7c3aed',
  },
  {
    id: 3,
    name: 'Rahul D.',
    location: 'Delhi, DL',
    rating: 5,
    quote: 'The fit is exactly what streetwear should be: relaxed but structured. Sizing was accurate, no surprises.',
    initials: 'RD',
    avatarColor: '#0f766e',
  },
  {
    id: 4,
    name: 'Sneha K.',
    location: 'Hyderabad, TS',
    rating: 5,
    quote: 'Absolutely obsessed with the pants. Great weight and does not look cheap even after multiple wears.',
    initials: 'SK',
    avatarColor: '#b45309',
  },
  {
    id: 5,
    name: 'Vikram R.',
    location: 'Pune, MH',
    rating: 5,
    quote: 'Custom upload was smooth and they even sent a mockup before printing. Felt like working with a pro studio.',
    initials: 'VR',
    avatarColor: '#be185d',
  },
  {
    id: 6,
    name: 'Ananya T.',
    location: 'Chennai, TN',
    rating: 5,
    quote: 'Gifted a tee to my brother and he has not stopped wearing it. The fabric softness is unreal.',
    initials: 'AT',
    avatarColor: '#065f46',
  },
  {
    id: 7,
    name: 'Karan B.',
    location: 'Kolkata, WB',
    rating: 5,
    quote: 'Pan-India delivery is real. I am in Kolkata and it arrived in 4 days. Packaging was clean and minimal.',
    initials: 'KB',
    avatarColor: '#1e40af',
  },
  {
    id: 8,
    name: 'Meera P.',
    location: 'Ahmedabad, GJ',
    rating: 5,
    quote: 'Third order now and the consistency is what keeps me coming back. Same quality every single time.',
    initials: 'MP',
    avatarColor: '#9f1239',
  },
];

/* ─── Variants ─────────────────────────────────────────────────── */

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

const textContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.2 } },
};

const textItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const trackVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.25 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.3 + i * 0.055,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const Stars = ({ rating, starClass = 'review-card-star' }) => (
  <>
    {[1, 2, 3, 4, 5].map((n) => (
      <svg
        key={n}
        className={`${starClass}${n > rating ? ' empty' : ''}`}
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </>
);

const ReviewSection = () => {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const isInView = useInView(sectionRef, { amount: 0.15, once: false });

  const [activeIndex, setActiveIndex] = useState(0);
  
  // Drag-to-scroll refs (Desktop only, matches productSection)
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const hasMoved = useRef(false);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const animationFrameId = useRef(null);

  const handleScroll = useCallback(() => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) return;
    const progress = scrollLeft / maxScroll;
    const idx = Math.round(progress * (REVIEWS.length - 1));
    setActiveIndex(idx);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const applyMomentum = () => {
    if (Math.abs(velocity.current) > 0.1 && !isDragging.current && trackRef.current) {
      trackRef.current.scrollLeft -= velocity.current;
      velocity.current *= 0.95; // Friction
      animationFrameId.current = requestAnimationFrame(applyMomentum);
    } else {
      velocity.current = 0;
      if (trackRef.current) {
        trackRef.current.style.scrollBehavior = 'smooth';
      }
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !trackRef.current) return;
    
    const x = e.pageX - trackRef.current.offsetLeft;
    const now = Date.now();
    const dt = now - lastTime.current;
    const dx = e.pageX - lastX.current;
    
    if (dt > 0) {
      velocity.current = dx / (dt / 16); // Normalized to 60fps
    }
    
    lastX.current = e.pageX;
    lastTime.current = now;

    const walk = (x - startX.current) * 1.5; // Scroll speed multiplier
    
    if (Math.abs(walk) > 5) {
      hasMoved.current = true;
    }
    
    trackRef.current.scrollLeft = scrollLeftStart.current - walk;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    if (trackRef.current) {
      trackRef.current.classList.remove('dragging');
      trackRef.current.style.scrollBehavior = 'smooth';
      trackRef.current.style.cursor = 'grab';
      trackRef.current.style.removeProperty('user-select');
      
      // If we were moving fast, apply momentum
      if (Math.abs(velocity.current) > 1) {
        trackRef.current.style.scrollBehavior = 'auto'; // Disable smooth for momentum
        animationFrameId.current = requestAnimationFrame(applyMomentum);
      }
    }

    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const onMouseDown = useCallback((e) => {
    // Only for desktop (innerWidth >= 768)
    if (window.innerWidth < 768) return;
    if (!trackRef.current) return;
    
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeftStart.current = trackRef.current.scrollLeft;
    lastX.current = e.pageX;
    lastTime.current = Date.now();
    velocity.current = 0;
    
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    
    // Disable smooth scroll during drag
    trackRef.current.classList.add('dragging');
    trackRef.current.style.scrollBehavior = 'auto';
    trackRef.current.style.cursor = 'grabbing';
    trackRef.current.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [handleMouseMove, handleMouseUp]);

  const scrollToIndex = useCallback((idx) => {
    if (!trackRef.current) return;
    const cards = trackRef.current.querySelectorAll('.review-card');
    if (!cards[idx]) return;
    const cardLeft = cards[idx].offsetLeft;
    const trackPadding = parseFloat(getComputedStyle(trackRef.current).paddingLeft) || 0;
    trackRef.current.scrollTo({ left: cardLeft - trackPadding, behavior: 'smooth' });
  }, []);

  const avgRating = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);

  return (
    <motion.section
      ref={sectionRef}
      className="review-section"
      variants={sectionVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <motion.div
        className="review-header"
        variants={textContainerVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        <motion.p className="review-eyebrow" variants={textItemVariants}>
          Customer Reviews
        </motion.p>
        <motion.h2 className="review-title" variants={textItemVariants}>
          Worn and Loved
        </motion.h2>
        <motion.p className="review-subtitle" variants={textItemVariants}>
          Real feedback from real customers - every order, every piece.
        </motion.p>

        <motion.div className="review-summary" variants={textItemVariants}>
          <span className="review-score-big">{avgRating}</span>
          <div className="review-summary-right">
            <div className="review-stars-row">
              <Stars rating={5} starClass="review-star" />
            </div>
            <span className="review-count">{REVIEWS.length} verified reviews</span>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="review-track-wrapper"
        variants={trackVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        <div
          ref={trackRef}
          className="review-track"
          onMouseDown={onMouseDown}
        >
          {REVIEWS.map((review, i) => (
            <motion.div
              key={review.id}
              className="review-card"
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.09)' }}
              transition={{ duration: 0.2 }}
            >
              <div className="review-card-stars">
                <Stars rating={review.rating} starClass="review-card-star" />
              </div>

              <p className="review-card-quote">"{review.quote}"</p>

              <div className="review-card-footer">
                <div
                  className="review-card-avatar"
                  style={{ background: review.avatarColor }}
                >
                  {review.initials}
                </div>
                <div>
                  <p className="review-card-name">{review.name}</p>
                  <p className="review-card-location">{review.location}</p>
                </div>
                <div className="review-card-verified">
                  <span className="review-verified-dot" />
                  Verified
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="review-nav" role="tablist" aria-label="Review navigation">
        {REVIEWS.map((_, i) => (
          <button
            key={i}
            className={`review-dot${activeIndex === i ? ' active' : ''}`}
            onClick={() => scrollToIndex(i)}
            aria-label={`Go to review ${i + 1}`}
            role="tab"
            aria-selected={activeIndex === i}
          />
        ))}
      </div>
    </motion.section>
  );
};

export default ReviewSection;
