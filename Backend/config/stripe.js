import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  console.error("Stripe API key not configured");
  throw new Error("Stripe API key is required");
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: "2023-10-16"
});

export default stripe;