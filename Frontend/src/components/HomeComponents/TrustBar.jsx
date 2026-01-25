import { motion } from "framer-motion";
import { BadgeCheck, Lock, Truck, Undo2 } from "lucide-react";

const items = [
  { icon: BadgeCheck, title: "Authenticity", desc: "Curated artists & originals" },
  { icon: Truck, title: "US Shipping", desc: "Reliable delivery nationwide" },
  { icon: Lock, title: "Secure Checkout", desc: "Protected payments" },
  { icon: Undo2, title: "Easy Returns", desc: "Simple support experience" },
];

const TrustBar = () => {
  return (
    <section className="border-y border-emerald-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((it, idx) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: idx * 0.06 }}
              className="rounded-2xl border border-emerald-100 bg-gradient-to-b from-white to-emerald-50/40 p-4"
            >
              <it.icon className="h-5 w-5 text-emerald-700" />
              <div className="mt-2 font-semibold text-gray-900">{it.title}</div>
              <div className="text-sm text-gray-600">{it.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;