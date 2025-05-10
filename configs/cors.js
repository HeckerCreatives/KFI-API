const CORS_ALLOWED = process.env.ALLOWED_CORS;
const METHODS_ALLOWED = process.env.ALLOWED_METHODS;

module.exports = {
  origin: (origin, cb) => {
    const allowedOrigins = CORS_ALLOWED.split(" ");
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error("CORS ERROR"));
    }
  },
  methods: METHODS_ALLOWED.split(" "), // List only` available methods
  credentials: true, // Must be set to true
  allowedHeaders: ["Origin", "Content-Type", "X-Requested-With", "Accept", "Authorization"],
};
