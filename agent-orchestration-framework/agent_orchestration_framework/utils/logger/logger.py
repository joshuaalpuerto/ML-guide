from typing import List, Optional, Dict, Any
import json
from agent_orchestration_framework.types import ConversationMessage, OrchestratorConfig
from logger_config import setup_logger


class Logger:
    _instance = None
    _logger = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, config: Optional[Dict[str, bool]] = None):
        if not hasattr(self, "initialized"):
            Logger._logger = setup_logger()
            self.initialized = True
        self.config: OrchestratorConfig = config or OrchestratorConfig()

    def print_chat_history(
        self, chat_history: List[ConversationMessage], agent_id: Optional[str] = None
    ) -> None:
        """Print the chat history for an agent or classifier."""
        is_agent_chat = agent_id is not None
        if (is_agent_chat and not self.config.LOG_AGENT_CHAT) or (
            not is_agent_chat and not self.config.LOG_CLASSIFIER_CHAT
        ):
            return

        title = (
            f"Agent {agent_id} Chat History"
            if is_agent_chat
            else "Classifier Chat History"
        )
        self.log_header(title)

        if not chat_history:
            self.get_logger().info("> - None -")
        else:
            for index, message in enumerate(chat_history, 1):
                role = message.role.upper()
                content = message.content
                text = content[0] if isinstance(content, list) else content
                text = text.get("text", "") if isinstance(text, dict) else str(text)
                trimmed_text = f"{text[:80]}..." if len(text) > 80 else text
                self.get_logger().info(f"> {index}. {role}: {trimmed_text}")
        self.get_logger().info("")

    def log_classifier_output(self, output: Any, is_raw: bool = False) -> None:
        """Log the classifier output."""
        if (is_raw and not self.config.LOG_CLASSIFIER_RAW_OUTPUT) or (
            not is_raw and not self.config.LOG_CLASSIFIER_OUTPUT
        ):
            return

        self.log_header(
            "Raw Classifier Output" if is_raw else "Processed Classifier Output"
        )
        self.get_logger().info(output if is_raw else json.dumps(output, indent=2))
        self.get_logger().info("")

    def print_execution_times(self, execution_times: Dict[str, float]) -> None:
        """Print execution times."""
        if not self.config.LOG_EXECUTION_TIMES:
            return

        self.log_header("Execution Times")
        if not execution_times:
            self.get_logger().info("> - None -")
        else:
            for timer_name, duration in execution_times.items():
                self.get_logger().info(f"> {timer_name}: {duration}s")
        self.get_logger().info("")
