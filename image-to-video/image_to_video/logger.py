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
            }
        },
        "handlers": {
            "stdout": {
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
                "formatter": "json",
            }
        },
        "loggers": {"": {"handlers": ["stdout"], "level": "DEBUG"}},
    }

    logging.config.dictConfig(LOGGING)

    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )
    logger = logging.getLogger(__name__)
    # This prevents log messages from being duplicated or handled by unexpected loggers
    logger.propagate = False

    return logger


logger = setup_logger()
