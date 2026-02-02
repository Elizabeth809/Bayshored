import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Heart,
  Eye,
  Award,
  Users,
  Palette,
  Globe,
  Shield,
  Truck,
  Star,
  Quote,
  Play,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  ArrowUpRight,
  Sparkles,
  Target,
  Gem,
  Clock,
  CheckCircle,
  Image,
  Brush,
  Frame
} from 'lucide-react';

const About = () => {
  const [activeValue, setActiveValue] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [countersVisible, setCountersVisible] = useState(false);
  const countersRef = useRef(null);

  // Intersection Observer for counter animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCountersVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (countersRef.current) {
      observer.observe(countersRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const values = [
    {
      icon: <Eye size={24} />,
      title: 'Curated Excellence',
      description: 'Every piece in our collection undergoes rigorous selection. We partner only with artists whose vision and craftsmanship meet our exacting standards, ensuring you discover truly exceptional works.'
    },
    {
      icon: <Heart size={24} />,
      title: 'Artist First',
      description: 'We believe in nurturing talent. Our artists receive fair compensation, global exposure, and the creative freedom to push boundaries. When artists thrive, extraordinary art emerges.'
    },
    {
      icon: <Shield size={24} />,
      title: 'Authenticity Guaranteed',
      description: 'Each artwork comes with a certificate of authenticity and provenance documentation. We stand behind every piece with our reputation and comprehensive buyer protection.'
    },
    {
      icon: <Globe size={24} />,
      title: 'Global Reach',
      description: 'Art knows no boundaries. We connect collectors across the United States with masterpieces from studios worldwide, bringing diverse perspectives into your space.'
    }
  ];

  const stats = [
    { value: 40, suffix: '+', label: 'Years of Excellence' },
    { value: 500, suffix: '+', label: 'Featured Artists' },
    { value: 15000, suffix: '+', label: 'Artworks Delivered' },
    { value: 50, suffix: '', label: 'States Served' }
  ];

  const testimonials = [
    {
      quote: "The attention to detail in selecting artists is remarkable. Every piece I've acquired has become a conversation starter and a treasured addition to my collection.",
      author: 'Margaret Chen',
      role: 'Private Collector, New York',
      image: '/testimonials/1.jpg'
    },
    {
      quote: "As an interior designer, I need reliable sources for exceptional art. This gallery consistently delivers pieces that transform spaces and exceed client expectations.",
      author: 'David Morrison',
      role: 'Interior Designer, Los Angeles',
      image: '/testimonials/2.jpg'
    },
    {
      quote: "The curation is impeccable. Each piece tells a story, and the team's knowledge of art history and contemporary movements is truly impressive.",
      author: 'Sarah Williams',
      role: 'Art Enthusiast, Chicago',
      image: '/testimonials/3.jpg'
    }
  ];

  const team = [
    {
      name: 'Alexandra Reid',
      role: 'Founder & Chief Curator',
      bio: 'With four decades in the art world, Alexandra has an unparalleled eye for emerging talent.',
      image: '/team/1.jpg'
    },
    {
      name: 'Marcus Chen',
      role: 'Director of Artist Relations',
      bio: 'Marcus nurtures our artist partnerships, ensuring every collaboration is meaningful and lasting.',
      image: '/team/2.jpg'
    },
    {
      name: 'Isabella Torres',
      role: 'Head of Collections',
      bio: 'Isabella oversees our growing collection, maintaining the highest standards of quality.',
      image: '/team/3.jpg'
    },
    {
      name: 'Jonathan Blake',
      role: 'Client Experience Director',
      bio: 'Jonathan ensures every collector receives personalized attention and expert guidance.',
      image: '/team/4.jpg'
    }
  ];

  const milestones = [
    { year: '1984', title: 'The Beginning', description: 'Founded with a vision to bridge artists and collectors through meaningful connections.' },
    { year: '1995', title: 'First Gallery', description: 'Opened our flagship space, establishing a home for emerging contemporary artists.' },
    { year: '2008', title: 'Global Expansion', description: 'Extended our reach internationally, partnering with artists from 30+ countries.' },
    { year: '2020', title: 'Digital Evolution', description: 'Launched our online platform, making exceptional art accessible to collectors nationwide.' },
    { year: '2024', title: 'New Horizons', description: 'Celebrating 40 years with our most ambitious collection yet.' }
  ];

  // Counter animation component
  const AnimatedCounter = ({ value, suffix }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!countersVisible) return;

      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [countersVisible, value]);

    return (
      <span>
        {count.toLocaleString()}{suffix}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-96 h-96 border border-gray-900 rounded-full"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 border border-gray-900 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-gray-900 rounded-full"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 mb-8">
            <Sparkles size={16} className="text-gray-600" />
            <span className="text-sm text-gray-600 uppercase tracking-widest">Art Gallery</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-light text-gray-900 leading-tight mb-8">
            Where Art Finds
            <br />
            <span className="italic">Its Home</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12">
            For over four decades, we have been the bridge between visionary artists 
            and discerning collectors, curating extraordinary works that transform 
            spaces and inspire souls.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/store"
              className="group flex items-center space-x-3 px-8 py-4 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer"
            >
              <span className="font-medium">Explore Collection</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              to="/contact"
              className="group flex items-center space-x-3 px-8 py-4 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 cursor-pointer"
            >
              <span className="font-medium">Get in Touch</span>
              <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-gray-400 rounded-full animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image Grid */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-[4/5] bg-gray-200 overflow-hidden shadow-lg">
                    <img
                      src="/about/gallery-1.jpg"
                      alt="Gallery interior"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                        e.target.parentElement.innerHTML = '<div class="text-gray-400"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                      }}
                    />
                  </div>
                  <div className="aspect-square bg-gray-200 overflow-hidden shadow-lg">
                    <img
                      src="/about/gallery-2.jpg"
                      alt="Art exhibition"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                        e.target.parentElement.innerHTML = '<div class="text-gray-400"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="aspect-square bg-gray-200 overflow-hidden shadow-lg">
                    <img
                      src="/about/gallery-3.jpg"
                      alt="Artist at work"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                        e.target.parentElement.innerHTML = '<div class="text-gray-400"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                      }}
                    />
                  </div>
                  <div className="aspect-[4/5] bg-gray-200 overflow-hidden shadow-lg">
                    <img
                      src="/about/gallery-4.jpg"
                      alt="Artwork detail"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                        e.target.parentElement.innerHTML = '<div class="text-gray-400"><svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 bg-gray-900 text-white p-6 shadow-xl">
                <p className="text-4xl font-light">40+</p>
                <p className="text-sm uppercase tracking-wider mt-1">Years</p>
              </div>
            </div>

            {/* Content */}
            <div className="lg:pl-8">
              <span className="text-sm text-gray-500 uppercase tracking-widest">Our Story</span>
              <h2 className="text-4xl font-light text-gray-900 mt-4 mb-8">
                A Legacy of
                <br />
                <span className="italic">Artistic Discovery</span>
              </h2>

              <div className="space-y-6 text-gray-600 leading-relaxed">
                <p>
                  What began as a passionate pursuit of exceptional art has evolved into 
                  a distinguished platform connecting visionary creators with collectors 
                  who appreciate the extraordinary. Our journey started in 1984, driven 
                  by an unwavering belief that great art has the power to transform not 
                  just spaces, but lives.
                </p>
                <p>
                  Over four decades, we have cultivated relationships with hundreds of 
                  remarkable artists—from emerging talents to established masters. Each 
                  collaboration is built on mutual respect, creative freedom, and a shared 
                  commitment to authenticity. We don't simply display art; we tell the 
                  stories behind every brushstroke.
                </p>
                <p>
                  Today, our curated collection spans diverse styles, mediums, and 
                  perspectives, yet maintains one constant: uncompromising quality. 
                  Whether you're a seasoned collector expanding your portfolio or 
                  discovering your first meaningful piece, we're honored to guide 
                  your journey into the world of exceptional art.
                </p>
              </div>

              <div className="mt-10 pt-10 border-t border-gray-200">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 border-2 border-gray-900 flex items-center justify-center">
                    <Quote size={24} className="text-gray-900" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium italic">
                      "Art is not what you see, but what you make others see."
                    </p>
                    <p className="text-sm text-gray-500 mt-1">— Edgar Degas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section ref={countersRef} className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center group"
              >
                <p className="text-5xl lg:text-6xl font-light mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-gray-400 uppercase tracking-wider text-sm">
                  {stat.label}
                </p>
                <div className="w-12 h-0.5 bg-white/20 mx-auto mt-4 group-hover:w-24 group-hover:bg-white/50 transition-all duration-500"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm text-gray-500 uppercase tracking-widest">What Drives Us</span>
            <h2 className="text-4xl font-light text-gray-900 mt-4">
              Our Core <span className="italic">Values</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Values Navigation */}
            <div className="space-y-4">
              {values.map((value, index) => (
                <button
                  key={index}
                  onClick={() => setActiveValue(index)}
                  className={`w-full text-left p-6 border-2 transition-all duration-300 cursor-pointer ${
                    activeValue === index
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                      activeValue === index
                        ? 'bg-gray-900 text-white'
                        : 'border border-gray-300 text-gray-600'
                    }`}>
                      {value.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{value.title}</h3>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`text-gray-400 transition-transform duration-300 ${
                        activeValue === index ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>

            {/* Active Value Detail */}
            <div className="bg-gray-50 p-10 lg:p-12 flex flex-col justify-center min-h-[400px]">
              <div className="w-16 h-16 bg-gray-900 text-white flex items-center justify-center mb-8">
                {values[activeValue].icon}
              </div>
              <h3 className="text-2xl font-light text-gray-900 mb-6">
                {values[activeValue].title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                {values[activeValue].description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm text-gray-500 uppercase tracking-widest">Our Journey</span>
            <h2 className="text-4xl font-light text-gray-900 mt-4">
              Four Decades of <span className="italic">Excellence</span>
            </h2>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-300 hidden lg:block"></div>

            <div className="space-y-12 lg:space-y-0">
              {milestones.map((milestone, index) => (
                <div
                  key={index}
                  className={`relative lg:flex items-center ${
                    index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  <div className="lg:w-1/2 lg:px-12">
                    <div className={`p-8 bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 ${
                      index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'
                    }`}>
                      <span className="text-4xl font-light text-gray-300">{milestone.year}</span>
                      <h3 className="text-xl font-medium text-gray-900 mt-2">{milestone.title}</h3>
                      <p className="text-gray-600 mt-3">{milestone.description}</p>
                    </div>
                  </div>

                  {/* Timeline Dot */}
                  <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 w-5 h-5 bg-gray-900 border-4 border-white shadow-md z-10"></div>

                  <div className="lg:w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm text-gray-400 uppercase tracking-widest">Testimonials</span>
            <h2 className="text-4xl font-light text-white mt-4">
              What Our <span className="italic">Collectors</span> Say
            </h2>
          </div>

          <div className="relative">
            {/* Testimonial Content */}
            <div className="text-center">
              <Quote size={48} className="mx-auto text-gray-600 mb-8" />
              
              <div className="min-h-[200px] flex items-center justify-center">
                <div key={currentTestimonial} className="animate-fade-in">
                  <p className="text-2xl lg:text-3xl font-light leading-relaxed mb-8 italic">
                    "{testimonials[currentTestimonial].quote}"
                  </p>
                  <div>
                    <p className="font-medium text-lg">{testimonials[currentTestimonial].author}</p>
                    <p className="text-gray-400 text-sm mt-1">{testimonials[currentTestimonial].role}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Dots */}
              <div className="flex items-center justify-center space-x-3 mt-12">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 transition-all duration-300 cursor-pointer ${
                      currentTestimonial === index
                        ? 'bg-white w-8'
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-sm text-gray-500 uppercase tracking-widest">Why Choose Us</span>
              <h2 className="text-4xl font-light text-gray-900 mt-4 mb-8">
                The Art Gallery <span className="italic">Difference</span>
              </h2>

              <div className="space-y-6">
                {[
                  {
                    icon: <Palette size={20} />,
                    title: 'Expert Curation',
                    desc: 'Every piece is hand-selected by our team of art historians and curators.'
                  },
                  {
                    icon: <Shield size={20} />,
                    title: 'Authenticated Works',
                    desc: 'Full provenance documentation and certificates of authenticity included.'
                  },
                  {
                    icon: <Truck size={20} />,
                    title: 'White Glove Delivery',
                    desc: 'Professional handling and climate-controlled shipping nationwide.'
                  },
                  {
                    icon: <Clock size={20} />,
                    title: '30-Day Returns',
                    desc: 'Not completely satisfied? Return any piece within 30 days.'
                  },
                  {
                    icon: <Users size={20} />,
                    title: 'Personal Consultation',
                    desc: 'One-on-one guidance from our art advisors for every purchase.'
                  }
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 group"
                  >
                    <div className="w-10 h-10 border border-gray-300 flex items-center justify-center flex-shrink-0 group-hover:border-gray-900 group-hover:bg-gray-900 group-hover:text-white transition-all duration-300">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <p className="text-gray-600 text-sm mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gray-100 overflow-hidden shadow-2xl">
                <img
                  src="/about/why-choose.jpg"
                  alt="Art consultation"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                    e.target.parentElement.innerHTML = '<div class="text-gray-300"><svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                  }}
                />
              </div>

              {/* Floating Card */}
              <div className="absolute -bottom-8 -left-8 bg-white p-8 shadow-xl border border-gray-100 max-w-xs">
                <div className="flex items-center space-x-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-gray-900 fill-gray-900" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm italic">
                  "Exceptional service and stunning collection. A true gem for art lovers."
                </p>
                <p className="text-gray-500 text-xs mt-3">— Verified Collector</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6">
            Ready to Find Your
            <br />
            <span className="italic">Perfect Piece?</span>
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Browse our curated collection of extraordinary artworks or speak with 
            one of our art advisors to find the perfect addition to your space.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/store"
              className="group flex items-center space-x-3 px-10 py-5 bg-gray-900 text-white border-2 border-gray-900 hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer"
            >
              <span className="font-medium text-lg">View Collection</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              to="/contact"
              className="group flex items-center space-x-3 px-10 py-5 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 cursor-pointer"
            >
              <span className="font-medium text-lg">Contact Us</span>
              <Mail size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default About;