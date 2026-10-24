"""Optional VERIFY step run through the OpenAI Agents SDK, pointed at the same Gemma 4 endpoint.

Off by default (USE_AGENT_VERIFY=false). If anything fails, the pipeline silently uses direct tool calls.
"""
import json

from . import config
from .schemas import Evidence, Extracted
from .tools import domains, web_search


async def run(extracted: Extracted, web_check: bool) -> list[Evidence]:
    from agents import Agent, ModelSettings, OpenAIChatCompletionsModel, Runner, function_tool, set_tracing_disabled
    from openai import AsyncOpenAI

    set_tracing_disabled(True)
    collected: list[Evidence] = []

    @function_tool
    def check_domain(link: str) -> str:
        """Check one link for lookalike or unofficial domain signs."""
        ev = domains.check_link(link)
        collected.extend(ev)
        return json.dumps([e.model_dump() for e in ev])

    @function_tool
    async def search_scam_reports(term: str) -> str:
        """Search the web for scam reports about a link host, phone number or brand. Only call with extracted text."""
        ev = await web_search.scam_reports([term])
        collected.extend(ev)
        return json.dumps([e.model_dump() for e in ev])

    tools = [check_domain] + ([search_scam_reports] if web_check else [])
    client = AsyncOpenAI(base_url=config.LLM_BASE_URL, api_key=config.LLM_API_KEY, timeout=config.LLM_TIMEOUT)
    agent = Agent(
        name="Verifier",
        instructions="Call check_domain for every link given. If search tool exists, call it once for the sender or phone. Then reply 'done'.",
        model=OpenAIChatCompletionsModel(model=config.LLM_MODEL, openai_client=client),
        model_settings=ModelSettings(temperature=0),
        tools=tools,
    )
    await Runner.run(agent, json.dumps(extracted.model_dump()), max_turns=6)
    return collected
