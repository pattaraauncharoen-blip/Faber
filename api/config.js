module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    apiKey: process.env.FIREBASE_API_KEY || "",
    projectId: process.env.FIREBASE_PROJECT_ID || "",
  });
};
