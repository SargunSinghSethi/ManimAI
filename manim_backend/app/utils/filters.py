import re

# Patterns that indicate malicious behavior
dangerous_patterns = [
    r"(os\.|subprocess|eval|exec)",
    r"(delete|remove|overwrite|format).*file",
    r"access.*(network|internet|socket)",
    r"(send|get|post).*(request|http)",
    r"(steal|leak|expose).*data",
    r"(import).*?(os|sys|socket|shutil)",
]

def is_prompt_unsafe(prompt: str):
    lowered = prompt.lower()

    for pattern in dangerous_patterns:
        if re.search(pattern,lowered):
            return True, f"Prompt contains potentially dangerous pattern: {pattern}"
    return False, None