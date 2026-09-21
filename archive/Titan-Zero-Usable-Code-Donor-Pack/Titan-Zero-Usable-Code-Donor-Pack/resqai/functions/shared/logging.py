import logging
import sys
from datetime import datetime, timezone
from typing import Any, Optional


class StructuredFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "correlation_id"):
            log_entry["correlation_id"] = record.correlation_id
        if hasattr(record, "function_name"):
            log_entry["function_name"] = record.function_name
        if hasattr(record, "extra_data"):
            log_entry["extra"] = record.extra_data
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)
        import json
        return json.dumps(log_entry, default=str)


def get_logger(name: str, level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(getattr(logging, level.upper(), logging.INFO))
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredFormatter())
        logger.addHandler(handler)
    return logger


class LoggerContext:
    def __init__(self, logger: logging.Logger, correlation_id: Optional[str] = None, function_name: Optional[str] = None) -> None:
        self._logger = logger
        self._correlation_id = correlation_id
        self._function_name = function_name

    def _log(self, level: int, msg: str, **kwargs: Any) -> None:
        extra = kwargs.pop("extra", {})
        if self._correlation_id:
            extra["correlation_id"] = self._correlation_id
        if self._function_name:
            extra["function_name"] = self._function_name
        self._logger.log(level, msg, extra={"extra_data": extra}, **kwargs)

    def info(self, msg: str, **kwargs: Any) -> None:
        self._log(logging.INFO, msg, **kwargs)

    def warn(self, msg: str, **kwargs: Any) -> None:
        self._log(logging.WARNING, msg, **kwargs)

    def error(self, msg: str, **kwargs: Any) -> None:
        self._log(logging.ERROR, msg, **kwargs)

    def debug(self, msg: str, **kwargs: Any) -> None:
        self._log(logging.DEBUG, msg, **kwargs)

    def child(self, name: str) -> "LoggerContext":
        return LoggerContext(
            logger=get_logger(f"{self._logger.name}.{name}"),
            correlation_id=self._correlation_id,
            function_name=self._function_name,
        )


def create_logger(name: str, correlation_id: Optional[str] = None, function_name: Optional[str] = None) -> LoggerContext:
    return LoggerContext(get_logger(name), correlation_id=correlation_id, function_name=function_name)
