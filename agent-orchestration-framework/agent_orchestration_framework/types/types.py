from enum import Enum
from typing import List, Dict, Union, TypedDict, Optional, Any
from dataclasses import dataclass

# Constants
OPENAI_MODEL_ID_GPT_O_MINI = "gpt-4o-mini"


class ToolInput(TypedDict):
    userinput: str
    selected_agent: str
    confidence: str


class RequestMetadata(TypedDict):
    user_input: str
    agent_id: str
    agent_name: str
    user_id: str
    session_id: str
    additional_params: Optional[Dict[str, str]]
    error_type: Optional[str]


class ParticipantRole(Enum):
    ASSISTANT = "assistant"
    USER = "user"


class ConversationMessage:
    role: ParticipantRole
    content: List[Any]

    def __init__(self, role: ParticipantRole, content: Optional[List[Any]] = None):
        self.role = role
        self.content = content


class TimestampedMessage(ConversationMessage):
    def __init__(
        self,
        role: ParticipantRole,
        content: Optional[List[Any]] = None,
        timestamp: int = 0,
    ):
        super().__init__(role, content)  # Call the parent constructor
        self.timestamp = timestamp  # Initialize the timestamp attribute


TemplateVariables = Dict[str, Union[str, List[str]]]


@dataclass
class OrchestratorConfig:
    LOG_AGENT_CHAT: bool = False  # pylint: disable=invalid-name
    LOG_CLASSIFIER_CHAT: bool = False  # pylint: disable=invalid-name
    LOG_CLASSIFIER_RAW_OUTPUT: bool = False  # pylint: disable=invalid-name
    LOG_CLASSIFIER_OUTPUT: bool = False  # pylint: disable=invalid-name
    LOG_EXECUTION_TIMES: bool = False  # pylint: disable=invalid-name
    MAX_RETRIES: int = 3  # pylint: disable=invalid-name
    USE_DEFAULT_AGENT_IF_NONE_IDENTIFIED: bool = True  # pylint: disable=invalid-name
    CLASSIFICATION_ERROR_MESSAGE: str = None
    NO_SELECTED_AGENT_MESSAGE: str = (
        "I'm sorry, I couldn't determine how to handle your request.\
    Could you please rephrase it?"  # pylint: disable=invalid-name
    )
    GENERAL_ROUTING_ERROR_MSG_MESSAGE: str = None
    MAX_MESSAGE_PAIRS_PER_AGENT: int = 100  # pylint: disable=invalid-name
