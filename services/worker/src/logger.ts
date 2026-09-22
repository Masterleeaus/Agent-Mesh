/**
 * Worker service logger — thin wrapper around @titan-zero/log.
 *
 * Usage:
 *   import { logger } from "./logger.js";
 *   logger.info("poll tick", { due: 3 });
 *   logger.error("db error", err, { automationId });
 *
 * Test helper:
 *   import { _setWriter } from "./logger.js";  // test-only
 */

import { createLogger, type LogLevel, type LogRecord } from "@titan-zero/log";

const { logger, _setWriter } = createLogger({ service: "worker" });

export { logger, _setWriter, type LogLevel, type LogRecord };