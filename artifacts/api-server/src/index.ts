import app from "./app";

// ভেরসেল (Vercel) এর জন্য এটি প্রয়োজন
export default app;

// লোকাল হোস্টে চালানোর জন্য নিচের অংশটি থাকে
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
