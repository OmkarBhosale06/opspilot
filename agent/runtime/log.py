"""Agent logs use the same shape as the API: (functionName) message."""

from __future__ import annotations

import json
import logging
import os
import sys

_LEVELS = {
    "trace": logging.DEBUG,
    "debug": logging.DEBUG,
    "info": logging.INFO,
    "warn": logging.WARNING,
    "warning": logging.WARNING,
    "error": logging.ERROR,
}


class _FnFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        function_name = getattr(record, "fn", record.funcName)
        line = (
            f"[{self.formatTime(record, '%H:%M:%S')}] "
            f"{record.levelname}: ({function_name}) {record.getMessage()}"
        )
        fields = getattr(record, "fields", None)
        if fields:
            line += " " + json.dumps(fields, default=str, separators=(",", ":"))
        return line


def _logger() -> logging.Logger:
    log = logging.getLogger("opspilot.agent")
    if log.handlers:
        return log
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(_FnFormatter())
    log.addHandler(handler)
    log.setLevel(_LEVELS.get(os.environ.get("LOG_LEVEL", "info").lower(), logging.INFO))
    log.propagate = False
    return log


def _emit(level: int, function_name: str, message: str, fields: dict | None) -> None:
    _logger().log(level, message, extra={"fn": function_name, "fields": fields or None})


def debug(function_name: str, message: str, **fields: object) -> None:
    _emit(logging.DEBUG, function_name, message, fields or None)


def info(function_name: str, message: str, **fields: object) -> None:
    _emit(logging.INFO, function_name, message, fields or None)


def warn(function_name: str, message: str, **fields: object) -> None:
    _emit(logging.WARNING, function_name, message, fields or None)


def error(function_name: str, message: str, **fields: object) -> None:
    _emit(logging.ERROR, function_name, message, fields or None)
