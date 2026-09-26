from __future__ import annotations

import os
from functools import lru_cache

from langchain_openai import ChatOpenAI

from runtime.log import info


def llm_settings() -> dict:
    return {
        "base_url": os.environ.get("AGENT_LLM_BASE_URL", "http://127.0.0.1:11434/v1").rstrip("/"),
        "model": os.environ.get("AGENT_LLM_MODEL", "qwen2.5:1.5b"),
        "api_key": os.environ.get("AGENT_LLM_API_KEY", "ollama"),
    }


@lru_cache(maxsize=1)
def _chat_client() -> ChatOpenAI:
    settings = llm_settings()
    info("_chat_client", "called", model=settings["model"], baseUrl=settings["base_url"])
    return ChatOpenAI(
        model=settings["model"],
        base_url=settings["base_url"],
        api_key=settings["api_key"],
        temperature=0,
        timeout=40,
        max_retries=0,
    )


def chat_model() -> ChatOpenAI:
    info("chat_model", "called")
    return _chat_client()
