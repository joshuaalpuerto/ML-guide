import logging.config
from pythonjsonlogger import jsonlogger


def setup_logger():
    LOGGING = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "format": "%(asctime)s %(levelname)s %(message)s",
                "datefmt": "%Y-%m-%dT%H:%M:%SZ",
                "class": "pythonjsonlogger.jsonlogger.JsonFormatter",
                # Map levelname to severity for Google logs
                "rename_fields": {"levelname": "severity"},
            }
        },
        "handlers": {
            "stdout": {
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
                "formatter": "json",
            }
        },
        "loggers": {
            "": {
                "handlers": ["stdout"],
                "level": "DEBUG",
            },
        },
    }

    # List of third-party loggers to suppress DEBUG logs
    third_party_loggers = [
        # api request trigger by fireworks or openai
        "httpx",
        "httpcore",
        "fireworks",
        "langchain",
        "openai",
    ]

    # Dynamically add loggers with ERROR level to suppress DEBUG logs
    for third_party_logger in third_party_loggers:
        LOGGING["loggers"][third_party_logger] = {
            "level": logging.ERROR,
            "handlers": ["stdout"],
            "propagate": False,
        }

    logging.config.dictConfig(LOGGING)
    logger = logging.getLogger(__name__)

    return logger


logger = setup_logger()
