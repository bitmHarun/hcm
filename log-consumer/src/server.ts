import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 8090;

// Middleware to parse raw body
app.use(bodyParser.raw({ type: "*/*", limit: "50mb" }));

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "../received_logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

interface LogMetadata {
  feed: string;
  system: string;
  environment: string;
  compression: string;
}

interface LogLevels {
  [key: string]: number;
}

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Main datafeed endpoint to receive logs
app.post("/stroom/datafeed", (req: Request, res: Response) => {
  try {
    // Extract headers sent by stroom-log-sender
    const feed = (req.headers["feed"] as string) || "unknown";
    const system = (req.headers["system"] as string) || "unknown";
    const environment = (req.headers["environment"] as string) || "unknown";
    const compression = (req.headers["compression"] as string) || "none";

    // Get the log data
    const logData = req.body.toString("utf-8");

    // Log receipt information
    console.log("\n========== LOG RECEIVED ==========");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Feed: ${feed}`);
    console.log(`System: ${system}`);
    console.log(`Environment: ${environment}`);
    console.log(`Compression: ${compression}`);
    console.log(`Data size: ${req.body.length} bytes`);
    console.log("==================================");

    // Display first 500 characters of log data
    console.log("Log preview:");
    console.log(logData.substring(0, 500));
    console.log("==================================\n");

    // Save to file (optional)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${feed}_${system}_${timestamp}.log`;
    const filepath = path.join(logsDir, filename);

    fs.writeFileSync(filepath, logData);
    console.log(`✓ Saved to: ${filepath}\n`);

    // Process your logs here
    const metadata: LogMetadata = { feed, system, environment, compression };
    processLogs(logData, metadata);

    // Send success response
    res.status(200).json({
      status: "success",
      message: "Logs received successfully",
      feed: feed,
      received_bytes: req.body.length,
      saved_to: filename,
    });
  } catch (error) {
    console.error("Error processing logs:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      status: "error",
      message: errorMessage,
    });
  }
});

// Function to process received logs
function processLogs(logData: string, metadata: LogMetadata): void {
  // Add your custom log processing logic here
  // Examples:
  // - Parse JSON logs
  // - Extract specific fields
  // - Send to database
  // - Trigger alerts
  // - Aggregate metrics

  const lines = logData.split("\n").filter((line) => line.trim());
  console.log(`Processing ${lines.length} log lines...`);

  // Example: Count log levels if they exist
  const logLevels: LogLevels = {};
  lines.forEach((line) => {
    const levelMatch = line.match(/\b(INFO|WARN|ERROR|DEBUG|FATAL)\b/);
    if (levelMatch) {
      const level = levelMatch[1];
      logLevels[level] = (logLevels[level] || 0) + 1;
    }
  });

  if (Object.keys(logLevels).length > 0) {
    console.log("Log level breakdown:", logLevels);
  }

  // Example: Parse JSON logs
  lines.forEach((line, index) => {
    try {
      const parsed = JSON.parse(line);
      // Do something with parsed JSON log
      // console.log(`Line ${index + 1}:`, parsed);
    } catch (e) {
      // Not JSON, skip or handle as plain text
    }
  });
}

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Stroom Log Receiver running on port ${PORT}`);
  console.log(
    `📥 Ready to receive logs at: http://localhost:${PORT}/stroom/datafeed`,
  );
  console.log(`💚 Health check: http://localhost:${PORT}/health\n`);
});
