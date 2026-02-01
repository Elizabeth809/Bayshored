// src/components/home/NewsletterSubscription.jsx
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Mail, 
  User, 
  Sparkles
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`mt-4 rounded-lg p-4 ${
        isSuccess
          ? "bg-white text-gray-900"
          : "bg-white text-gray-900"
      }`}
    >
      <div className="flex items-start gap-3">
        {isSuccess ? (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            <CheckCircle2 className="h-5 w-5" />
          </motion.div>
        ) : (
          <AlertTriangle className="mt-0.5 h-5 w-5" />
        )}
        <div className="leading-relaxed font-medium">{message}</div>
      </div>
    </motion.div>
  );
};

const FloatingParticles = ({ count = 15 }) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const left = Math.round(Math.random() * 100);
      const size = 2 + Math.round(Math.random() * 8);
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
          className="absolute bottom-[-40px] rounded-full bg-white/20"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
          animate={{
            y: [-40, -400],
            opacity: [0, 0.4, 0],
            scale: [0.8, 1, 0.8],
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

  // SIMPLE VARIANT
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <FloatingParticles count={12} />

        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.6 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-5 w-5 text-gray-900" />
            </motion.div>
            <span className="text-gray-900 text-sm font-medium tracking-wide">
              JOIN OUR COMMUNITY
            </span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-playfair text-3xl sm:text-4xl font-light text-gray-900 mb-4"
          >
            Get new art drops & private offers
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-600 font-light"
          >
            Early access for collectors. No spam, only beautiful work.
          </motion.p>
        </div>

        <motion.form 
          onSubmit={handleSubmit} 
          className="max-w-lg mx-auto space-y-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="space-y-4">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-900 z-10" />
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white pl-12 pr-4 py-3 font-light outline-none transition-all focus:border-gray-900"
              />
            </motion.div>

            <motion.div 
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-900 z-10" />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white pl-12 pr-4 py-3 font-light outline-none transition-all focus:border-gray-900"
              />
            </motion.div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative w-full flex items-center justify-center gap-3 rounded-lg bg-gray-900 px-6 py-4 font-light text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Subscribing...</span>
                </>
              ) : (
                <>
                  <span>Subscribe now</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {message && <MessageToast type={messageType} message={message} />}
          </AnimatePresence>

          <motion.p 
            className="text-center text-sm text-gray-500 font-light"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            We respect your privacy. Unsubscribe anytime.
          </motion.p>
        </motion.form>

        {/* Animated line */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent via-gray-300 to-transparent"
          animate={{ 
            height: ['20px', '40px', '20px']
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        />
      </div>
    </section>
  );
};

export default NewsletterSubscription;