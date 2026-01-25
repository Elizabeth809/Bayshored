import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Mail, 
  User, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Star,
  Gift,
  Bell,
  Palette,
  TrendingUp,
  Award,
  Zap
} from "lucide-react";

import { CLIENT_BASE_URL } from "../others/clientApiUrl";
import { useAuth } from "../../context/AuthContext";

const normalizeUser = (payload) => {
  const u =
    payload?.data?.user ||
    payload?.data ||
    payload?.user ||
    payload?.profile ||
    null;

  if (!u) return null;

  return {
    name: u?.name || u?.fullName || u?.username || "",
    email: u?.email || u?.gmail || "",
  };
};

const MessageToast = ({ type, message }) => {
  const isSuccess = type === "success";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className={`mt-4 rounded-2xl border p-4 text-sm shadow-lg ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      <div className="flex items-start gap-3">
        {isSuccess ? (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          </motion.div>
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
        )}
        <div className="leading-relaxed font-medium">{message}</div>
      </div>
    </motion.div>
  );
};

const FloatingParticles = ({ count = 20 }) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const left = Math.round(Math.random() * 100);
      const size = 4 + Math.round(Math.random() * 12);
      const delay = Math.random() * 8;
      const duration = 12 + Math.random() * 10;
      return { id: i, left, size, delay, duration };
    });
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute bottom-[-40px] rounded-full bg-emerald-300/30 blur-sm"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
          animate={{
            y: [-40, -600],
            opacity: [0, 0.6, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

const FloatingIcons = () => {
  const icons = [
    { Icon: Palette, delay: 0, x: "10%", y: "15%" },
    { Icon: Star, delay: 1, x: "85%", y: "20%" },
    { Icon: Sparkles, delay: 2, x: "15%", y: "75%" },
    { Icon: Award, delay: 1.5, x: "90%", y: "70%" },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
      {icons.map(({ Icon, delay, x, y }, idx) => (
        <motion.div
          key={idx}
          className="absolute text-white"
          style={{ left: x, top: y }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Icon className="h-8 w-8" />
        </motion.div>
      ))}
    </div>
  );
};

const NewsletterSubscription = ({ variant = "default" }) => {
  const { isAuthenticated, token, user } = useAuth();

  const [formData, setFormData] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;
    if (user?.name || user?.email) {
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
      });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const ac = new AbortController();

    const fetchProfile = async () => {
      if (!isAuthenticated || !token) return;
      if (formData.name || formData.email) return;

      const endpointsToTry = [
        `${CLIENT_BASE_URL}/api/v1/auth/me`,
        `${CLIENT_BASE_URL}/api/v1/users/me`,
        `${CLIENT_BASE_URL}/api/v1/profile/me`,
      ];

      for (const url of endpointsToTry) {
        try {
          const res = await fetch(url, {
            signal: ac.signal,
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) continue;
          const data = await res.json();

          const normalized = normalizeUser(data);
          if (normalized?.name || normalized?.email) {
            setFormData({
              name: normalized.name || "",
              email: normalized.email || "",
            });
            break;
          }
        } catch (e) {
          if (e?.name === "AbortError") return;
        }
      }
    };

    fetchProfile();
    return () => ac.abort();
  }, [isAuthenticated, token]);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      const res = await fetch(`${CLIENT_BASE_URL}/api/v1/subscribers/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "An error occurred. Please try again.");

      setMessage(data?.message || "Subscribed successfully!");
      setMessageType("success");

      if (!isAuthenticated) setFormData({ name: "", email: "" });
    } catch (err) {
      setMessage(err?.message || "Subscription failed.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // INLINE VARIANT
  if (variant === "inline") {
    return (
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-white via-emerald-50/80 to-teal-50/60 p-8 shadow-2xl">
        <FloatingParticles count={12} />
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="h-full w-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <motion.div 
            className="min-w-0 flex-1"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-300 bg-white px-4 py-2 shadow-lg"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-5 w-5 text-emerald-600" />
              </motion.div>
              <span className="text-xs font-bold tracking-wide text-emerald-800">NEW DROPS</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap className="h-4 w-4 text-yellow-500" />
              </motion.div>
            </motion.div>
            
            <h3 className="mt-4 font-playfair text-2xl lg:text-3xl font-bold text-gray-900">
              Get new art drops & private offers
            </h3>
            <p className="mt-2 text-gray-700 font-medium">
              Early access for collectors in the USA. 🎨
            </p>
          </motion.div>

          <motion.form 
            onSubmit={handleSubmit} 
            className="w-full lg:max-w-xl"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-emerald-200 bg-white pl-12 pr-4 py-4 font-medium outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600" />
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border-2 border-emerald-200 bg-white pl-12 pr-4 py-4 font-medium outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 font-bold text-white shadow-lg shadow-emerald-600/30 transition-all hover:shadow-xl hover:shadow-emerald-600/40 disabled:opacity-60"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600"
                  initial={{ x: "100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10">
                  {loading ? "Loading..." : "Subscribe"}
                </span>
                {!loading && (
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="relative z-10"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </motion.div>
                )}
              </motion.button>
            </div>

            <AnimatePresence>
              {message && <MessageToast type={messageType} message={message} />}
            </AnimatePresence>
          </motion.form>
        </div>
      </div>
    );
  }

  // DEFAULT PREMIUM VARIANT
  return (
    <section className="relative overflow-hidden rounded-3xl border-2 border-emerald-200 bg-white shadow-2xl">
      <FloatingParticles count={25} />

      <div className="relative grid lg:grid-cols-12">
        {/* LEFT SIDE - Enhanced with background image */}
        <div className="relative lg:col-span-5 overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <motion.img
              src="https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=80"
              alt="Art background"
              className="h-full w-full object-cover"
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-emerald-950/85 to-black/90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            
            {/* Animated Pattern Overlay */}
            <motion.div
              className="absolute inset-0 opacity-10"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
              }}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '80px 80px'
              }}
            />
          </div>

          <FloatingIcons />

          <div className="relative text-white p-8 sm:p-12 min-h-full flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              {/* Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", duration: 0.8 }}
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 bg-white/10 px-5 py-2 backdrop-blur-xl shadow-2xl"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-5 w-5 text-emerald-300" />
                </motion.div>
                <span className="text-sm font-bold tracking-wide text-white">
                  COLLECTOR INSIDER LIST
                </span>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Bell className="h-4 w-4 text-yellow-400" />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h2 
                className="mt-6 font-playfair text-4xl sm:text-5xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                Get early access to new originals and private releases.
              </motion.h2>

              <motion.p 
                className="mt-4 text-lg text-white/90 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                Curated landscapes, nature paintings, and contemporary works — shipped across the USA.
              </motion.p>

              {/* Preview Card */}
              <motion.div 
                className="mt-8 relative rounded-3xl border-2 border-white/20 bg-white/5 p-4 backdrop-blur-xl overflow-hidden shadow-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "300%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                
                <div className="relative overflow-hidden rounded-2xl">
                  <motion.img
                    src="https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1800&q=80"
                    alt="Art preview"
                    className="h-64 w-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  <motion.div 
                    className="absolute bottom-5 left-5 right-5 flex items-center justify-between"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div>
                      <div className="font-bold text-lg">Weekly Drops</div>
                      <div className="text-sm text-white/80">Curated for collectors</div>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="rounded-full border-2 border-emerald-300/40 bg-emerald-400/20 px-4 py-2 text-xs font-bold text-emerald-100 backdrop-blur-sm"
                    >
                      Exclusive
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* RIGHT SIDE - Enhanced Form */}
        <div className="lg:col-span-7 bg-gradient-to-br from-white via-emerald-50/50 to-white p-8 sm:p-12">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-30">
            <div 
              className="h-full w-full"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2310b981' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <motion.div
            className="relative max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block"
              >
                <Palette className="h-12 w-12 text-emerald-600 mb-4" />
              </motion.div>
              
              <h3 className="font-playfair text-3xl sm:text-4xl font-bold text-gray-900">
                Join our art community
              </h3>
              <p className="mt-3 text-lg text-gray-700 leading-relaxed">
                No spam. Only beautiful work, artist stories, and collector-only offers. ✨
              </p>
            </motion.div>

            {/* Form */}
            <motion.form 
              onSubmit={handleSubmit} 
              className="mt-8 space-y-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600 z-10" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-2 border-emerald-200 bg-white pl-12 pr-4 py-4 font-medium outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 shadow-sm hover:shadow-md"
                  />
                </motion.div>

                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-600 z-10" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-2 border-emerald-200 bg-white pl-12 pr-4 py-4 font-medium outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 shadow-sm hover:shadow-md"
                  />
                </motion.div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-5 font-bold text-white shadow-xl shadow-emerald-600/30 transition-all hover:shadow-2xl hover:shadow-emerald-600/40 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600"
                  initial={{ x: "100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
                
                <motion.div
                  className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ["-100%", "300%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                
                {loading ? (
                  <span className="relative z-10 flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Subscribing...
                  </span>
                ) : (
                  <>
                    <span className="relative z-10 text-lg">Subscribe now</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="relative z-10"
                    >
                      <ArrowRight className="h-6 w-6" />
                    </motion.div>
                  </>
                )}
              </motion.button>
            </motion.form>

            <AnimatePresence>
              {message && <MessageToast type={messageType} message={message} />}
            </AnimatePresence>

            {/* Trust Cards */}
            <motion.div 
              className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              {[
                { icon: ShieldCheck, title: "Curated", desc: "Only quality artworks listed.", color: "emerald" },
                { icon: Award, title: "Secure", desc: "Protected checkout experience.", color: "blue" },
                { icon: TrendingUp, title: "Support", desc: "Fast help for collectors.", color: "purple" }
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 + idx * 0.1 }}
                  whileHover={{ y: -5, scale: 1.05 }}
                  className="rounded-2xl border-2 border-emerald-100 bg-white p-5 shadow-lg hover:shadow-xl transition-all"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-3 shadow-lg"
                  >
                    <item.icon className="h-6 w-6 text-white" />
                  </motion.div>
                  <div className="font-bold text-gray-900 text-lg mb-1">{item.title}</div>
                  <div className="text-sm text-gray-600 leading-relaxed">{item.desc}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Privacy Text */}
            <motion.p 
              className="mt-6 text-center text-sm text-gray-500"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              🔒 We respect your privacy. Unsubscribe anytime.
            </motion.p>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
      `}</style>
    </section>
  );
};

export default NewsletterSubscription;