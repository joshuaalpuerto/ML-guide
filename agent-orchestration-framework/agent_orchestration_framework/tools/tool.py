from typing import Any, Optional, Callable, Union
from dataclasses import dataclass
from agent_orchestration_framework.types import (
    ParticipantRole,
)


@dataclass
class PropertyDefinition:
    type: str
    description: str
    enum: Optional[list] = None


# Note you could also format here the format of the tool depends on llm service you use (anthropic/openai/bedrock)
@dataclass
class ToolResult:
    tool_use_id: str
    content: Any

    def to_default_format(self) -> dict:
        return {
            "type": "tool_result",
            "tool_use_id": self.tool_use_id,
            "content": self.content,
        }


class Tool:
    def __init__(
        self,
        name: str,
        description: Optional[str] = None,
        properties: Optional[dict[str, dict[str, Any]]] = None,
        required: Optional[list[str]] = None,
        func: Optional[Callable] = None,
        enum_values: Optional[dict[str, list]] = None,
    ):

        self.name = name
        # Extract docstring if description not provided
        if description is None:
            raise ValueError("Function must be provided")

        if not func:
            raise ValueError("Function must be provided")

        self.func_description = description
        self.enum_values = enum_values or {}

        # Extract properties from the function if not passed
        self.properties = properties
        self.required = required or list(self.properties.keys())
        self.func = func

        # Add enum values to properties if they exist
        for prop_name, enum_vals in self.enum_values.items():
            if prop_name in self.properties:
                self.properties[prop_name]["enum"] = enum_vals

    def to_openai_format(self) -> dict[str, Any]:
        """Convert generic tool definition to OpenAI format"""
        return {
            "type": "function",
            "function": {
                "name": self.name.lower().replace("_tool", ""),
                "description": self.func_description,
                "parameters": {
                    "type": "object",
                    "properties": self.properties,
                    "required": self.required,
                    "additionalProperties": False,
                },
            },
        }


class Tools:
    def __init__(self, tools: list[Tool]):
        self.tools: list[Tool] = tools

    async def tool_handler(
        self, provider_type, response: Any, _conversation: list[dict[str, Any]]
    ) -> Any:
        if not response.content:
            raise ValueError("No content blocks in response")

        tool_results = []
        content_blocks = response.content

        for block in content_blocks:
            # Determine if it's a tool use block based on platform
            tool_use_block = self._get_tool_use_block(provider_type, block)
            if not tool_use_block:
                continue

            tool_name = tool_use_block.name
            tool_id = tool_use_block.id

            # Get input based on platform
            input_data = tool_use_block.input

            # Process the tool use
            result = await self._process_tool(tool_name, input_data)

            # Create tool result
            tool_result = ToolResult(tool_id, result)

            # Format according to platform
            formatted_result = tool_result.to_default_format()

            tool_results.append(formatted_result)

        return {"role": ParticipantRole.USER.value, "content": tool_results}

    def _get_tool_use_block(self, block: dict) -> Union[dict, None]:
        """Extract tool use block based on platform format. Right now only OpenAI is supported"""

        return block

    def _process_tool(self, tool_name, input_data):
        try:
            tool = next(tool for tool in self.tools if tool.name == tool_name)
            return tool.func(**input_data)
        except StopIteration:
            return f"Tool '{tool_name}' not found"
