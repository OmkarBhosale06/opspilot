from __future__ import annotations

import os
from functools import lru_cache

from langchain_openai import ChatOpenAI


def llm_settings() -> dict:
    return {
        "base_url": os.environ.get("AGENT_LLM_BASE_URL", "http://127.0.0.1:11434/v1").rstrip("/"),
        "model": os.environ.get("AGENT_LLM_MODEL", "qwen2.5:1.5b"),
        "api_key": os.environ.get("AGENT_LLM_API_KEY", "ollama"),
    }


@lru_cache(maxsize=1)
def chat_model() -> ChatOpenAI:
    settings = llm_settings()
    return ChatOpenAI(
        model=settings["model"],
        base_url=settings["base_url"],
        api_key=settings["api_key"],
        temperature=0,
        timeout=40,
        max_retries=0,
    )
